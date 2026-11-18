import type { AppLanguage, NavSection } from '../types/voice';

export interface CopySet {
  brandName: string;
  nav: Record<NavSection, string>;
  navDescriptions: Record<NavSection, string>;
  topAction: Record<NavSection, string>;
  sidebar: {
    endpointLabel: string;
    toolsLabel: string;
    sessionsLabel: string;
    languageLabel: string;
    openMenu: string;
    closeMenu: string;
  };
  status: {
    geminiReady: string;
    geminiMissing: string;
    mcpActive: string;
  };
  connect: {
    title: string;
    subtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    endpointTitle: string;
    endpointHint: string;
    copyBtn: string;
    copiedBtn: string;
    tabDesktopHttp: string;
    tabClaudeCode: string;
    tabStdio: string;
    desktopHttpDesc: string;
    claudeCodeDesc: string;
    stdioDesc: string;
    downloadStdioBtn: string;
    configPathHint: string;
    toolsTableTitle: string;
    colTool: string;
    colModel: string;
    colPurpose: string;
    toolDescriptions: Record<string, string>;
  };
  tts: {
    title: string;
    subtitle: string;
    modeSingle: string;
    modeDialogue: string;
    voiceLabel: string;
    secondVoiceLabel: string;
    styleLabel: string;
    stylePlaceholder: string;
    scriptLabel: string;
    scriptPlaceholderSingle: string;
    scriptPlaceholderDialogue: string;
    cuesLabel: string;
    presetUzbek: string;
    presetDialogue: string;
    generateBtn: string;
    generatingBtn: string;
    outputTitle: string;
    outputEmptyTitle: string;
    outputEmptyDesc: string;
    downloadWav: string;
    sendToStt: string;
    emptyTextError: string;
    dialogueLinesError: string;
  };
  stt: {
    title: string;
    subtitle: string;
    tabRecord: string;
    tabUpload: string;
    tabFromHistory: string;
    startRecord: string;
    stopRecord: string;
    recordingActive: string;
    micPermissionError: string;
    uploadPrompt: string;
    uploadHint: string;
    selectedFile: string;
    historyAudioEmpty: string;
    instructionLabel: string;
    instructionPlaceholder: string;
    presetVerbatimUz: string;
    presetSummary: string;
    presetTimestamps: string;
    transcribeBtn: string;
    transcribingBtn: string;
    resultTitle: string;
    resultEmptyTitle: string;
    resultEmptyDesc: string;
    copyTranscript: string;
    sendToTts: string;
    noAudioError: string;
  };
  inspector: {
    title: string;
    subtitle: string;
    presetsLabel: string;
    requestLabel: string;
    responseLabel: string;
    sendBtn: string;
    sendingBtn: string;
    invalidJsonError: string;
    generatedAudioTitle: string;
  };
  history: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAll: string;
    filterTts: string;
    filterStt: string;
    filterMcp: string;
    emptyTitle: string;
    emptyDesc: string;
    emptyCta: string;
    colType: string;
    colSource: string;
    colContent: string;
    colModel: string;
    colMetrics: string;
    colActions: string;
    deleteLabel: string;
    playLabel: string;
    stopLabel: string;
    refreshBtn: string;
  };
}

const UZ_COPY: CopySet = {
  brandName: 'SadoMCP',
  nav: {
    connect: 'Claude MCP Ulash',
    tts: 'Ovozga aylantirish (TTS)',
    stt: 'Matnga aylantirish (STT)',
    inspector: 'MCP Protokol Konsoli',
    history: 'Audio Tarix',
  },
  navDescriptions: {
    connect: 'Claude AI bilan Model Context Protocol integratsiyasi',
    tts: 'Gemini 3.8 TTS yordamida matndan tabiiy nutq yaratish',
    stt: 'Gemini 3.5 Transcribe orqali ovozni matnga o‘girish',
    inspector: 'Jonli /mcp JSON-RPC 2.0 serverini sinash',
    history: 'Studio va MCP orqali bajarilgan barcha amallar',
  },
  topAction: {
    connect: 'MCP Serverni Sinash',
    tts: 'Namuna Matn Yuklash',
    stt: 'Tarixdan Audio Olish',
    inspector: 'Tools Ro‘yxatini Olish',
    history: 'Tarixni Yangilash',
  },
  sidebar: {
    endpointLabel: 'MCP Endpoint',
    toolsLabel: 'MCP Asboblar',
    sessionsLabel: 'Sessiyalar',
    languageLabel: 'Til',
    openMenu: 'Menyuni ochish',
    closeMenu: 'Menyuni yopish',
  },
  status: {
    geminiReady: 'Gemini API ulangan',
    geminiMissing: 'GEMINI_API_KEY kutilmoqda',
    mcpActive: 'MCP HTTP & SSE faol',
  },
  connect: {
    title: 'Claude AI ni MCP orqali Gemini TTS va STT ga ulang',
    subtitle:
      'Ushbu server Claude Desktop va Claude Code uchun tayyor Model Context Protocol (MCP) interfeysini taqdim etadi. Claude suhbat davomida ovoz yaratishi va audio fayllarni matnga aylantirishi mumkin.',
    step1Title: '1. Claude AI So‘rovi',
    step1Desc: 'Claude foydalanuvchi topshirig‘iga ko‘ra MCP asbobini tanlaydi.',
    step2Title: '2. SadoMCP Server',
    step2Desc: 'JSON-RPC 2.0 (/mcp) so‘rovni qabul qilib Gemini SDK ga uzatadi.',
    step3Title: '3. Gemini TTS & STT',
    step3Desc: '24kHz WAV ovoz yaratadi yoki audioni aniq transkripsiya qiladi.',
    endpointTitle: 'Jonli MCP Server Manzili',
    endpointHint:
      'Streamable HTTP (/mcp) va SSE (/mcp/sse) transportlari bir vaqtda ishlaydi.',
    copyBtn: 'Nusxalash',
    copiedBtn: 'Nusxalandi',
    tabDesktopHttp: 'Claude Desktop (HTTP)',
    tabClaudeCode: 'Claude Code CLI',
    tabStdio: 'Mahalliy Stdio Skript',
    desktopHttpDesc:
      'Claude Desktop dasturidagi claude_desktop_config.json fayliga quyidagi blokni qo‘shing va Claude ni qayta ishga tushiring.',
    claudeCodeDesc:
      'Terminalda Claude Code CLI orqali ushbu MCP serverni bir buyruq bilan ulang:',
    stdioDesc:
      'Agar internet proksisiz, to‘g‘ridan-to‘g‘ri lokal Node.js jarayoni orqali ulamoqchi bo‘lsangiz, tayyor .mjs skriptni yuklab oling.',
    downloadStdioBtn: 'gemini-voice-mcp.mjs Yuklab Olish',
    configPathHint:
      'macOS: ~/Library/Application Support/Claude/claude_desktop_config.json · Windows: %APPDATA%\\Claude\\claude_desktop_config.json',
    toolsTableTitle: 'Claude AI uchun ochiq MCP Asboblar',
    colTool: 'MCP Asbob nomi',
    colModel: 'Gemini Modeli',
    colPurpose: 'Vazifasi',
    toolDescriptions: {
      gemini_text_to_speech:
        'Matn yoki 2 kishilik dialogdan 24kHz WAV ovoz yaratadi va URL qaytaradi.',
      gemini_speech_to_text:
        'Base64 audio yoki serverdagi audioId ni aniq matnga aylantiradi.',
      list_gemini_voices:
        'Barcha mavjud ovozlar (Kore, Puck, Charon, Fenrir, Zephyr) va teglarni qaytaradi.',
      list_audio_sessions:
        'Oxirgi TTS va STT sessiyalar ro‘yxatini Claude ga taqdim etadi.',
    },
  },
  tts: {
    title: 'Gemini Text-to-Speech (TTS) Studiyasi',
    subtitle:
      'Yakka diktor yoki ikki kishilik podkast dialogi rejimida tabiiy nutq yarating. Yaratilgan audio MCP vositalari orqali Claude bilan ham bo‘lishiladi.',
    modeSingle: 'Yakka ovoz',
    modeDialogue: 'Ikki kishilik dialog',
    voiceLabel: 'Asosiy ovoz',
    secondVoiceLabel: 'Ikkinchi suhbatdosh ovozi',
    styleLabel: 'Ohang va uslub ko‘rsatmasi (ixtiyoriy)',
    stylePlaceholder: 'Masalan: Iliq, aniq va professional diktor ohangi',
    scriptLabel: 'Matn yoki dialog ssenariysi',
    scriptPlaceholderSingle:
      'O‘zbek yoki boshqa tilda ovozga aylantiriladigan matnni kiriting...',
    scriptPlaceholderDialogue:
      'Alex: Assalomu alaykum! <breath> Bugun Claude va Gemini MCP haqida gaplashamiz.\nSam: |yeah| Bu ovozli interfeyslar uchun juda qulay yechim!',
    cuesLabel: 'Ifodali teglar (gemini-3.8-flash-tts):',
    presetUzbek: 'O‘zbekcha namuna',
    presetDialogue: 'Dialog namunasi',
    generateBtn: 'Ovoz yaratish',
    generatingBtn: 'Ovoz yaratilmoqda...',
    outputTitle: 'Natija va Audio Pleyer',
    outputEmptyTitle: 'Audio hali yaratilmagan',
    outputEmptyDesc:
      'Chap tarafdagi maydonga matn yozing, ovoz turini tanlang va "Ovoz yaratish" tugmasini bosing.',
    downloadWav: 'WAV Yuklab olish',
    sendToStt: 'STT da tekshirish',
    emptyTextError: 'Iltimos, ovozga aylantirish uchun matn kiriting.',
    dialogueLinesError:
      'Dialog rejimi uchun kamida 2 qator suhbat kiriting (masalan: "Alex: ...\\nSam: ...").',
  },
  stt: {
    title: 'Gemini Speech-to-Text (STT) Transkripsiya',
    subtitle:
      'Mikrofon orqali ovoz yozing, audio fayl yuklang yoki oldingi TTS natijasini tanlab gemini-3.5-transcribe bilan matnga o‘giring.',
    tabRecord: 'Mikrofondan yozish',
    tabUpload: 'Fayl yuklash',
    tabFromHistory: 'Tarixdan tanlash',
    startRecord: 'Yozishni boshlash',
    stopRecord: 'Yozishni to‘xtatish',
    recordingActive: 'Ovoz yozilmoqda',
    micPermissionError:
      'Mikrofonga ruxsat berilmadi yoki qurilma topilmadi. Fayl yuklash yoki tarixdan tanlashdan foydalanishingiz mumkin.',
    uploadPrompt: 'Audio faylni tanlang (.wav, .mp3, .webm, .ogg, .m4a)',
    uploadHint: 'Maksimal hajm 20 MB gacha',
    selectedFile: 'Tanlangan audio',
    historyAudioEmpty:
      'Tarixda hali audio fayl yo‘q. Avval TTS yarating yoki fayl yuklang.',
    instructionLabel: 'Transkripsiya ko‘rsatmasi',
    instructionPlaceholder:
      'Audioni asl tilida xatosiz va tinish belgilari bilan yozib ber.',
    presetVerbatimUz: 'Asl tilda aniq matn',
    presetSummary: 'Matn + qisqa xulosa',
    presetTimestamps: 'Gapma-gap ajratish',
    transcribeBtn: 'Matnga aylantirish',
    transcribingBtn: 'Tahlil qilinmoqda...',
    resultTitle: 'Transkripsiya Natijasi',
    resultEmptyTitle: 'Matn kutilmoqda',
    resultEmptyDesc:
      'Audio yozib oling yoki yuklang, so‘ng "Matnga aylantirish" tugmasini bosing.',
    copyTranscript: 'Matnni nusxalash',
    sendToTts: 'TTS da qayta o‘qish',
    noAudioError: 'Avval audio yozing, fayl yuklang yoki tarixdan tanlang.',
  },
  inspector: {
    title: 'Jonli MCP Protokol Konsoli',
    subtitle:
      'Claude AI yuboradigan haqiqiy JSON-RPC 2.0 so‘rovlarini /mcp endpointiga yuboring va natijani tekshiring.',
    presetsLabel: 'Tezkor MCP so‘rovlar:',
    requestLabel: 'JSON-RPC 2.0 So‘rov',
    responseLabel: 'Server Javobi',
    sendBtn: 'So‘rov yuborish',
    sendingBtn: 'Yuborilmoqda...',
    invalidJsonError: 'JSON formati noto‘g‘ri. Sintaksisni tekshiring.',
    generatedAudioTitle: 'MCP asbobi yaratgan audio:',
  },
  history: {
    title: 'Audio va Transkripsiya Tarixi',
    subtitle:
      'Web studiya hamda Claude MCP asboblari orqali yaratilgan barcha TTS va STT sessiyalari.',
    searchPlaceholder: 'Matn, ovoz yoki model bo‘yicha qidirish...',
    filterAll: 'Barchasi',
    filterTts: 'TTS',
    filterStt: 'STT',
    filterMcp: 'MCP orqali',
    emptyTitle: 'Hozircha sessiyalar mavjud emas',
    emptyDesc:
      'TTS ovoz yaratganingizda yoki STT transkripsiya bajarganingizda barcha natijalar shu jadvalda ko‘rinadi.',
    emptyCta: 'Birinchi TTS yaratish',
    colType: 'Tur',
    colSource: 'Manba',
    colContent: 'Mazmuni',
    colModel: 'Model',
    colMetrics: 'Ko‘rsatkichlar',
    colActions: 'Amallar',
    deleteLabel: 'O‘chirish',
    playLabel: 'Tinglash',
    stopLabel: 'To‘xtatish',
    refreshBtn: 'Yangilash',
  },
};

const EN_COPY: CopySet = {
  brandName: 'SadoMCP',
  nav: {
    connect: 'Connect Claude MCP',
    tts: 'Text-to-Speech (TTS)',
    stt: 'Speech-to-Text (STT)',
    inspector: 'MCP Protocol Console',
    history: 'Audio History',
  },
  navDescriptions: {
    connect: 'Connect Claude AI to Gemini voice tools via MCP',
    tts: 'Synthesize natural speech with Gemini 3.8 TTS',
    stt: 'Transcribe audio recordings with Gemini 3.5 Transcribe',
    inspector: 'Test live JSON-RPC 2.0 calls against /mcp',
    history: 'All studio and Claude MCP voice operations',
  },
  topAction: {
    connect: 'Test MCP Server',
    tts: 'Load Sample Script',
    stt: 'Pick From History',
    inspector: 'Fetch tools/list',
    history: 'Refresh History',
  },
  sidebar: {
    endpointLabel: 'MCP Endpoint',
    toolsLabel: 'MCP Tools',
    sessionsLabel: 'Sessions',
    languageLabel: 'Language',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
  },
  status: {
    geminiReady: 'Gemini API connected',
    geminiMissing: 'GEMINI_API_KEY required',
    mcpActive: 'MCP HTTP & SSE active',
  },
  connect: {
    title: 'Connect Claude AI to Gemini TTS & STT over MCP',
    subtitle:
      'This server exposes a standards-compliant Model Context Protocol (MCP) interface for Claude Desktop and Claude Code, enabling voice synthesis and audio transcription inside your Claude chats.',
    step1Title: '1. Claude AI Tool Call',
    step1Desc: 'Claude invokes the matching MCP voice tool from conversation.',
    step2Title: '2. SadoMCP Server',
    step2Desc: 'Processes JSON-RPC 2.0 (/mcp) and invokes the Gemini SDK.',
    step3Title: '3. Gemini TTS & STT',
    step3Desc: 'Returns 24kHz WAV speech or accurate multi-language transcripts.',
    endpointTitle: 'Live MCP Server Endpoint',
    endpointHint:
      'Both Streamable HTTP (/mcp) and legacy SSE (/mcp/sse) transports are active.',
    copyBtn: 'Copy',
    copiedBtn: 'Copied',
    tabDesktopHttp: 'Claude Desktop (HTTP)',
    tabClaudeCode: 'Claude Code CLI',
    tabStdio: 'Local Stdio Script',
    desktopHttpDesc:
      'Add this server entry to your claude_desktop_config.json file and restart Claude Desktop.',
    claudeCodeDesc:
      'Register this MCP server directly in Claude Code CLI with one command:',
    stdioDesc:
      'Prefer running a local Node.js stdio process directly on your machine? Download the standalone script below.',
    downloadStdioBtn: 'Download gemini-voice-mcp.mjs',
    configPathHint:
      'macOS: ~/Library/Application Support/Claude/claude_desktop_config.json · Windows: %APPDATA%\\Claude\\claude_desktop_config.json',
    toolsTableTitle: 'Exposed MCP Tools for Claude AI',
    colTool: 'Tool Name',
    colModel: 'Gemini Model',
    colPurpose: 'Capability',
    toolDescriptions: {
      gemini_text_to_speech:
        'Generates 24kHz WAV audio from single-speaker text or dual-speaker dialogue.',
      gemini_speech_to_text:
        'Transcribes base64 audio or an existing server audioId into text.',
      list_gemini_voices:
        'Lists supported voices (Kore, Puck, Charon, Fenrir, Zephyr) and cues.',
      list_audio_sessions:
        'Returns recent TTS and STT sessions so Claude can reference them.',
    },
  },
  tts: {
    title: 'Gemini Text-to-Speech (TTS) Studio',
    subtitle:
      'Synthesize single-speaker narration or dual-speaker podcast dialogue. Generated clips are automatically available to Claude via MCP.',
    modeSingle: 'Single Speaker',
    modeDialogue: 'Dual-Speaker Dialogue',
    voiceLabel: 'Primary Voice',
    secondVoiceLabel: 'Second Speaker Voice',
    styleLabel: 'Delivery Style (optional)',
    stylePlaceholder: 'e.g. Warm, articulate, measured narrator tone',
    scriptLabel: 'Text or Dialogue Script',
    scriptPlaceholderSingle: 'Enter text to synthesize into speech...',
    scriptPlaceholderDialogue:
      'Alex: Welcome back! <breath> Today we are exploring Claude MCP with Gemini voice.\nSam: |yeah| Real-time voice tools make workflows effortless.',
    cuesLabel: 'Expressive cues (gemini-3.8-flash-tts):',
    presetUzbek: 'Uzbek Sample',
    presetDialogue: 'Dialogue Sample',
    generateBtn: 'Generate Speech',
    generatingBtn: 'Synthesizing...',
    outputTitle: 'Synthesized Audio Output',
    outputEmptyTitle: 'No audio generated yet',
    outputEmptyDesc:
      'Enter a script on the left, pick a voice profile, and click "Generate Speech".',
    downloadWav: 'Download WAV',
    sendToStt: 'Verify in STT',
    emptyTextError: 'Please enter text to synthesize.',
    dialogueLinesError:
      'Dialogue mode requires at least 2 lines (e.g. "Alex: ...\\nSam: ...").',
  },
  stt: {
    title: 'Gemini Speech-to-Text (STT) Studio',
    subtitle:
      'Record directly from your microphone, upload an audio file, or pick a clip from history to transcribe with gemini-3.5-transcribe.',
    tabRecord: 'Record Microphone',
    tabUpload: 'Upload Audio File',
    tabFromHistory: 'Select From History',
    startRecord: 'Start Recording',
    stopRecord: 'Stop Recording',
    recordingActive: 'Recording audio',
    micPermissionError:
      'Microphone access unavailable or denied. Use File Upload or History selection instead.',
    uploadPrompt: 'Choose an audio file (.wav, .mp3, .webm, .ogg, .m4a)',
    uploadHint: 'Maximum file size 20 MB',
    selectedFile: 'Selected audio',
    historyAudioEmpty:
      'No audio clips in history yet. Generate a TTS clip or upload a file first.',
    instructionLabel: 'Transcription Instruction',
    instructionPlaceholder:
      'Transcribe verbatim in the original spoken language with punctuation.',
    presetVerbatimUz: 'Verbatim Original',
    presetSummary: 'Transcript + Summary',
    presetTimestamps: 'Sentence Breakdown',
    transcribeBtn: 'Transcribe Audio',
    transcribingBtn: 'Transcribing...',
    resultTitle: 'Transcription Result',
    resultEmptyTitle: 'Waiting for audio input',
    resultEmptyDesc:
      'Record, upload, or select an audio clip and click "Transcribe Audio".',
    copyTranscript: 'Copy Transcript',
    sendToTts: 'Re-speak in TTS',
    noAudioError: 'Please record, upload, or select an audio clip first.',
  },
  inspector: {
    title: 'Live MCP Protocol Console',
    subtitle:
      'Send real JSON-RPC 2.0 requests directly to /mcp and inspect Claude tool responses in real time.',
    presetsLabel: 'Quick MCP Requests:',
    requestLabel: 'JSON-RPC 2.0 Request',
    responseLabel: 'Server Response',
    sendBtn: 'Send Request',
    sendingBtn: 'Sending...',
    invalidJsonError: 'Invalid JSON syntax. Please check the request payload.',
    generatedAudioTitle: 'Audio generated by MCP tool:',
  },
  history: {
    title: 'Audio & Transcription History',
    subtitle:
      'All TTS and STT operations created through the Studio or Claude MCP tools.',
    searchPlaceholder: 'Search by text, voice, or model...',
    filterAll: 'All',
    filterTts: 'TTS',
    filterStt: 'STT',
    filterMcp: 'Via MCP',
    emptyTitle: 'No sessions recorded yet',
    emptyDesc:
      'Generated TTS audio clips and STT transcriptions will appear in this table.',
    emptyCta: 'Create First TTS',
    colType: 'Type',
    colSource: 'Source',
    colContent: 'Content',
    colModel: 'Model',
    colMetrics: 'Metrics',
    colActions: 'Actions',
    deleteLabel: 'Delete',
    playLabel: 'Play',
    stopLabel: 'Stop',
    refreshBtn: 'Refresh',
  },
};

export function getCopy(lang: AppLanguage): CopySet {
  return lang === 'en' ? EN_COPY : UZ_COPY;
}
