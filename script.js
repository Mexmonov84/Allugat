const searchInput = document.getElementById('search-input');
const translationOutput = document.getElementById('translation-output');
const languageSelect = document.getElementById('language-select');
const resultsSection = document.getElementById('results');
const dictionaryForm = document.getElementById('dictionaryForm');

if (dictionaryForm) {
    dictionaryForm.addEventListener('submit', function(e) {
        e.preventDefault();
    });
}

let timeoutId = null;

// FONETIK TAHLIL
function analyzeFonetics(word) {
    const w = word.toLowerCase().trim();
    const vowels = ['a', 'o', 'i', 'u', 'e', 'o‘', 'o\'', 'o’'];
    
    let vowelCount = 0;
    let consonantCount = 0;

    for (let char of w) {
        if (vowels.includes(char)) {
            vowelCount++;
        } else if (/[a-z‘'’]/i.test(char)) {
            consonantCount++;
        }
    }

    return {
        syllables: vowelCount > 0 ? vowelCount : 1,
        vowelCount: vowelCount,
        consonantCount: consonantCount
    };
}

// SO'Z UCHUN MUTLAQO HAR XIL VA TABIIY GAP YARATISH
function generateUniqueSentence(word, pos) {
    const w = word.trim();
    
    // So'z harflari yig'indisi bo'yicha indeks hisoblash (har safar turli shablon tushadi)
    let charCodeSum = 0;
    for (let i = 0; i < w.length; i++) {
        charCodeSum += w.charCodeAt(i);
    }

    // Har bir so'z turkumi uchun ko'plab xilma-xil gap variantlari
    const sentenceBank = {
        "Ot": [
            `Bugungi darsimizda "${w}" tushunchasiga alohida to'xtalib o'tdik.`,
            `O'zbek tilida "${w}" so'zi juda ko'p o'rinlarda faol qo'llaniladi.`,
            `Ushbu kitobda "${w}" haqida juda muhim fikrlar ilgari surilgan.`,
            `Hayotda "${w}" tushunchasining o'rni va ahamiyati beqiyosdir.`,
            `Manbalarda "${w}" haqida batafsil va qiziqarli ma'lumotlar berilgan.`,
            `Kutubxonadan "${w}" mavzusiga oid yangi adabiyotlarni topdik.`
        ],
        "Fe‘l": [
            `U o'zining maqsadiga erishish uchun doimo "${w}" harakatida bo'ldi.`,
            `Bugun topshirilgan vazifani a'lo darajada "${w}" zarur.`,
            `Ushbu bosqichda barcha jarayonlarni e'tibor bilan "${w}" lozim.`
        ],
        "Sifat": [
            `Narsalarning xususiyatini belgilashda "${w}" so'zi aniqlik kiritadi.`,
            `Ushbu loyiha uchun juda "${w}" va mos keladigan yechim tanlandi.`,
            `Atrofdagi narsalarning "${w}" jihati darhol e'tiborni tortadi.`
        ],
        "Ravish": [
            `U berilgan murakkab topshiriqni juda "${w}" bajarib topshirdi.`,
            `Hodisalar biz kutgandan ko'ra ham "${w}" rivojlanib ketdi.`
        ],
        "Son": [
            `Tadbirkorlik faoliyatida "${w}" soni muhim ko'rsatkich hisoblanadi.`,
            `Javondan "${w}" ta yangi va qiziqarli kitoblarni tanlab oldik.`
        ],
        "Olmosh": [
            `Muloqot jarayonida "${w}" so'zi o'zaro tushunishni osonlashtiradi.`,
            `Uchrashuvda "${w}" masalalari atroficha muhokama qilindi.`
        ],
        "Ko‘makchi": [
            `Barcha natijalar hamda muvaffaqiyatlar "${w}" qo'lga kiritildi.`
        ],
        "Bog‘lovchi": [
            `A'lo kayfiyat bilan ish boshladik, "${w}" ishlarimiz o'ngidan keldi.`
        ],
        "Yuklama": [
            `Ushbu qoida va ma'lumotlar "${w}" barcha uchun foydalidir.`
        ]
    };

    const options = sentenceBank[pos] || sentenceBank["Ot"];
    const selectedIndex = charCodeSum % options.length;
    
    return options[selectedIndex];
}

// GRAMMATIK VA TURKUM TAHLILI
function analyzeUzbekWord(word) {
    const w = word.toLowerCase().trim();
    const fonetics = analyzeFonetics(w);

    let pos = "Ot";
    let desc = "Shaxs, narsa-buyum, joy va mavhum tushunchalarning nomini bildiruvchi so‘z turkumi.";

    const pronouns = ['men', 'sen', 'u', 'biz', 'siz', 'ular', 'bu', 'shu', 'o‘sha', 'o\'sha', 'o‘zi', 'o\'zi', 'kim', 'nima', 'qanday', 'qaysi', 'qancha', 'hamma', 'barcha', 'har bir', 'hech kim', 'hech narsa'];
    if (pronouns.includes(w)) {
        pos = "Olmosh";
        desc = "Ismlar va boshqa so‘zlar o‘rnida olmashinib qo‘llaniluvchi so‘z turkumi.";
    }
    else if (['bir', 'ikki', 'uch', 'to‘rt', 'to\'rt', 'besh', 'olti', 'yetti', 'sakkiz', 'toqqiz', 'o‘n', 'o\'n', 'yuz', 'ming', 'million'].includes(w) || w.endsWith('ta') || w.endsWith('inchi') || w.endsWith('unchi') || w.endsWith('ovlon') || !isNaN(w)) {
        pos = "Son";
        desc = "Narsa-buyum yoki hodisalarning miqdorini, sonini va tartibini bildiruvchi so‘z turkumi.";
    }
    else if (['bilan', 'uchun', 'haqida', 'kabi', 'singari', 'so‘ng', 'so\'ng', 'tomon', 'taraf', 'orqali', 'tufayli'].includes(w)) {
        pos = "Ko‘makchi";
        desc = "Munosabat bildirib, so‘zlarni bir-biriga bog‘lashga xizmat qiluvchi yordamchi so‘z.";
    }
    else if (['va', 'lekin', 'biroq', 'chunki', 'ya‘ni', 'ya\'ni', 'yoki', 'ammodan', 'garchand', 'go‘yo', 'go\'yo'].includes(w)) {
        pos = "Bog‘lovchi";
        desc = "Gap bo‘laklarini yoki qo‘shma gap tarkibidagi sodda gaplarni bog‘lovchi so‘z.";
    }
    else if (['ham', 'da', 'mi', 'chi', 'gina', 'qina', 'kin', 'oq', 'yoq', 'faqat'].includes(w)) {
        pos = "Yuklama";
        desc = "Alohida so‘zga yoki butun gapga qo‘shimcha ma‘no va ta‘kid beruvchi so‘z.";
    }
    else if (['oh', 'eh', 'voy', 'ura', 'uf', 'oho', 'bay-bay', 'axt'].includes(w)) {
        pos = "Undov so‘z";
        desc = "His-hayajon, tuyg‘u yoki istak-xohishni ifodalovchi so‘z turkumi.";
    }
    else if (['chirr', 'gurs', 'taq', 'lyuk', 'yalt', 'vizz', 'taq-tuq', 'shit-shit'].includes(w)) {
        pos = "Taqlid so‘z";
        desc = "Tovush yoki harakat-holatga taqlidni bildiruvchi so‘z turkumi.";
    }
    else if (['kerak', 'lozim', 'mumkin', 'shubhasiz', 'ehtimol', 'albatta', 'afsus'].includes(w)) {
        pos = "Modal so‘z";
        desc = "So‘zlovchining o‘z fikriga bo‘lgan munosabatini bildiruvchi so‘z.";
    }
    else if (w.endsWith('moq') || w.endsWith('ish') || w.endsWith('sh') || w.endsWith('di') || w.endsWith('yapti') || w.endsWith('ajak') || w.endsWith('moqchi')) {
        pos = "Fe‘l";
        desc = "Shaxs yoki narsa-buyumning harakati hamda holatini bildiruvchi so‘z turkumi.";
    }
    else if (w.endsWith('cha') || w.endsWith('an') || w.endsWith('lay') || ['tez', 'sekin', 'ko‘p', 'ko\'p', 'oz', 'darhol', 'bugun', 'erta', 'hamisha'].includes(w)) {
        pos = "Ravish";
        desc = "Harakat yoki belginining bajarilish holati, zamoni hamda darajasini bildiruvchi so‘z.";
    }
    else if (w.endsWith('li') || w.endsWith('siz') || w.endsWith('roq') || w.endsWith('gi') || ['katta', 'kichik', 'yaxshi', 'yomon', 'qizil', 'oq', 'qora', 'go‘zal', 'go\'zal'].includes(w)) {
        pos = "Sifat";
        desc = "Narsa-buyum va shaxslarning belgisini, xususiyatini ko‘rsatuvchi so‘z turkumi.";
    }

    const exampleSentence = generateUniqueSentence(word, pos);

    let structure = "Sodda (tub) so‘z";
    if (w.includes('-') || w.includes(' ')) {
        structure = "Qo‘shma / Juft so‘z";
    } else if (w.endsWith('lar') || w.endsWith('ning') || w.endsWith('ni') || w.endsWith('ga') || w.endsWith('da') || w.endsWith('dan')) {
        structure = "Sodda (qo‘shimchali) so‘z";
    }

    return {
        pos: pos,
        desc: desc,
        example: exampleSentence,
        syllables: fonetics.syllables,
        vowels: fonetics.vowelCount,
        consonants: fonetics.consonantCount,
        structure: structure
    };
}

// API ORQALI TARJIMA VA QIDIRUV
async function fetchTranslation() {
    if (!searchInput || !resultsSection || !translationOutput) return;

    const query = searchInput.value.trim();
    const langPair = languageSelect ? languageSelect.value : "uz-ru";

    if (!query) {
        translationOutput.value = "";
        resultsSection.innerHTML = `
            <h2>Qidiruv natijasi va So'z tasnifi</h2>
            <p style="color: #64748b; font-size: 0.9rem;">So'z kiriting, to'liq tilshunoslik tahlili ko'rinadi...</p>
        `;
        return;
    }

    translationOutput.value = "Tahlil qilinmoqda...";

    try {
        const [fromLang, toLang] = langPair.split('-');
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=${fromLang}|${toLang}`);
        const data = await response.json();

        const translatedText = data.responseData ? data.responseData.translatedText : "Tarjima topilmadi";
        const info = analyzeUzbekWord(query);
        
        translationOutput.value = translatedText;

        resultsSection.innerHTML = `
            <h2>Qidiruv natijasi va To'liq Tilshunoslik Tahlili</h2>
            
            <div class="result-card">
                <div class="result-header">
                    <h3>${query}</h3>
                    <span class="pronunciation">[${query.toLowerCase()}]</span>
                </div>

                <div class="pos-tag">
                    <span>So'z turkumi:</span> <strong>${info.pos}</strong>
                </div>

                <div class="info-block">
                    <h4>📖 So'zning ma'nosi va ta'rifi</h4>
                    <p>${info.desc}</p>
                </div>

                <div class="info-block">
                    <h4>💬 Namuna gap</h4>
                    <p class="example-text">${info.example}</p>
                </div>

                <div class="info-block">
                    <h4>📐 Fonetik va Grammatik tahlil</h4>
                    <ul class="classification-list">
                        <li><strong>Bo'g'inlar soni:</strong> ${info.syllables} ta bo'g'in</li>
                        <li><strong>Unli va undoshlar:</strong> ${info.vowels} ta unli, ${info.consonants} ta undosh harf</li>
                        <li><strong>Tuzilishiga ko'ra:</strong> ${info.structure}</li>
                        <li><strong>Grammatik turkumi:</strong> ${info.pos}</li>
                    </ul>
                </div>

                <div class="info-block">
                    <h4>🌐 Tarjima va Yo'nalish</h4>
                    <ul class="classification-list">
                        <li><strong>Yo'nalish:</strong> ${fromLang.toUpperCase()} ➔ ${toLang.toUpperCase()}</li>
                        <li><strong>Tarjimasi:</strong> <strong>${translatedText}</strong></li>
                    </ul>
                </div>
            </div>
        `;

    } catch (error) {
        translationOutput.value = "Xatolik yuz berdi";
    }
}

if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fetchTranslation, 300);
    });
}

if (languageSelect) {
    languageSelect.addEventListener('change', fetchTranslation);
}