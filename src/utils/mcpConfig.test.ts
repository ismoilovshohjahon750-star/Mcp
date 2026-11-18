import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClaudeCodeCliCommand,
  buildClaudeDesktopHttpConfig,
  buildClaudeDesktopStdioConfig,
  buildJsonRpcPayload,
  computeWavDurationSeconds,
  countWords,
  formatBytes,
  formatDuration,
  parseDialogueScript,
  validateTtsInput,
} from './mcpConfig';

test('computeWavDurationSeconds calculates 24kHz mono 16-bit WAV duration minus 44B header', () => {
  // 24000 samples/sec * 2 bytes/sample = 48000 bytes/sec
  assert.equal(computeWavDurationSeconds(48044), 1);
  assert.equal(computeWavDurationSeconds(44), 0);
  assert.equal(computeWavDurationSeconds(10), 0);
  assert.equal(computeWavDurationSeconds(44 + 48000 * 2.5), 2.5);
});

test('formatBytes and formatDuration render readable units', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
});

test('parseDialogueScript detects two speakers and preserves turns', () => {
  const parsed = parseDialogueScript(
    'Ali: Salom! <breath> Bugun nima qilamiz?\nLaylo: |yeah| MCP serverni ishga tushiramiz.'
  );
  assert.equal(parsed.speakerA, 'Ali');
  assert.equal(parsed.speakerB, 'Laylo');
  assert.equal(parsed.turns.length, 2);
  assert.equal(parsed.turns[0].speaker, 'Ali');
  assert.equal(parsed.turns[1].speaker, 'Laylo');
});

test('parseDialogueScript assigns alternating fallback speakers for plain lines', () => {
  const parsed = parseDialogueScript('Birinchi gap.\nIkkinchi gap.');
  assert.equal(parsed.speakerA, 'Alex');
  assert.equal(parsed.speakerB, 'Sam');
  assert.equal(parsed.turns[0].speaker, 'Alex');
  assert.equal(parsed.turns[1].speaker, 'Sam');
});

test('Claude Desktop and CLI config generators produce valid endpoints', () => {
  const desktopJson = JSON.parse(
    buildClaudeDesktopHttpConfig('https://example.run.app/')
  );
  assert.deepEqual(desktopJson.mcpServers['gemini-voice-mcp'], {
    command: 'npx',
    args: ['-y', 'mcp-remote', 'https://example.run.app/mcp'],
  });

  const stdioJson = JSON.parse(
    buildClaudeDesktopStdioConfig('/tmp/gemini-voice-mcp.mjs')
  );
  assert.equal(stdioJson.mcpServers['gemini-voice-mcp'].command, 'node');
  assert.deepEqual(stdioJson.mcpServers['gemini-voice-mcp'].args, [
    '/tmp/gemini-voice-mcp.mjs',
  ]);

  assert.equal(
    buildClaudeCodeCliCommand('https://example.run.app/'),
    'claude mcp add --transport http gemini-voice-mcp https://example.run.app/mcp'
  );
});

test('buildJsonRpcPayload builds compliant JSON-RPC 2.0 objects', () => {
  const payload = buildJsonRpcPayload('tools/call', { name: 'list_gemini_voices' }, 42);
  assert.deepEqual(payload, {
    jsonrpc: '2.0',
    id: 42,
    method: 'tools/call',
    params: { name: 'list_gemini_voices' },
  });
  assert.throws(() => buildJsonRpcPayload('   '));
});

test('validateTtsInput enforces non-empty text and dialogue line counts', () => {
  assert.deepEqual(
    validateTtsInput({ text: '   ', mode: 'single', voiceName: 'Kore' }),
    { valid: false, error: 'EMPTY_TEXT' }
  );
  assert.deepEqual(
    validateTtsInput({ text: 'Salom dunyo', mode: 'single', voiceName: 'Kore' }),
    { valid: true }
  );
  assert.deepEqual(
    validateTtsInput({ text: 'Faqat bitta qator', mode: 'dialogue', voiceName: 'Kore' }),
    { valid: false, error: 'DIALOGUE_NEEDS_TWO_LINES' }
  );
  assert.equal(countWords('  Salom   Claude   MCP  '), 3);
});
