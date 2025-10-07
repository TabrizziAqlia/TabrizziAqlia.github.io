// --- Skrip untuk Preloader Hitung Mundur ---
window.onload = () => {
    const preloader = document.getElementById('preloader');
    const countdownTimer = document.getElementById('countdown-timer');
    const mainContent = document.getElementById('main-content');
    let count = 3;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownTimer.textContent = count;
        } else {
            countdownTimer.style.animation = 'none'; // Stop glitch
            countdownTimer.style.fontSize = '8vw';
            countdownTimer.textContent = 'INITIATING...';
            clearInterval(countdownInterval);

            setTimeout(() => {
                preloader.style.opacity = '0';
                mainContent.style.opacity = '1';
                // Hapus preloader dari DOM setelah transisi selesai
                setTimeout(() => preloader.style.display = 'none', 500);
            }, 800);
        }
    }, 1000);
};

// --- Skrip Lainnya (Menu, Animasi, Rating) ---
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
mobileMenuButton.addEventListener('click', () => { mobileMenu.classList.toggle('hidden'); });
document.querySelectorAll('#mobile-menu a').forEach(link => { link.addEventListener('click', () => mobileMenu.classList.add('hidden')); });
const sections = document.querySelectorAll('.fade-in-section');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
}, { threshold: 0.1 });
sections.forEach(section => observer.observe(section));
document.getElementById('year').textContent = new Date().getFullYear();
const stars = document.querySelectorAll('#star-container .star');
const ratingMessage = document.getElementById('rating-message');
let currentRating = 0;
const highlightStars = (rating) => {
    stars.forEach(star => {
        if (star.dataset.value <= rating) {
            star.classList.remove('text-slate-600');
            star.classList.add('accent-color');
        } else {
            star.classList.remove('accent-color');
            star.classList.add('text-slate-600');
        }
    });
};
stars.forEach(star => {
    star.addEventListener('mouseover', () => { highlightStars(star.dataset.value); });
    star.addEventListener('mouseleave', () => { highlightStars(currentRating); });
    star.addEventListener('click', () => {
        currentRating = star.dataset.value;
        ratingMessage.textContent = `FEEDBACK DITERIMA: ${currentRating} BINTANG. TERIMA KASIH.`;
        ratingMessage.style.opacity = '1';
    });
});

// --- ✨ LOGIKA UNTUK FITUR GEMINI API ✨ ---
const generateBtn = document.getElementById('generate-ideas-btn');
const aiModal = document.getElementById('ai-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalContent = document.getElementById('modal-content');

const callGeminiAPI = async (skills, retries = 3, delay = 1000) => {
    // JANGAN UBAH API KEY. Ini akan otomatis diisi.
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    const userPrompt = `Based on these skills: ${skills.join(', ')}, suggest 3 creative and impressive project ideas for a student's portfolio. For each idea, provide a "projectName" and a short "description".`;

    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "projectIdeas": {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "projectName": { "type": "STRING" },
                                "description": { "type": "STRING" }
                            },
                            required: ["projectName", "description"]
                        }
                    }
                },
                required: ["projectIdeas"]
            }
        }
    };
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.candidates && result.candidates[0].content.parts[0].text) {
            return JSON.parse(result.candidates[0].content.parts[0].text);
        } else {
            throw new Error("Invalid response structure from API.");
        }

    } catch (error) {
        console.error("API Call failed:", error);
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return callGeminiAPI(skills, retries - 1, delay * 2); // Exponential backoff
        } else {
            return { error: "Gagal menghubungi AI setelah beberapa kali percobaan. Silakan coba lagi nanti." };
        }
    }
};

generateBtn.addEventListener('click', async () => {
    // Tampilkan modal dengan status loading
    aiModal.style.display = 'flex';
    modalContent.innerHTML = `<p class="text-center accent-color blinking-cursor">MENGHUBUNGKAN KE AI...</p>`;

    // Kumpulkan keahlian dari halaman
    const skillElements = document.querySelectorAll('.skill-item p');
    const skills = Array.from(skillElements).map(el => el.textContent);
    
    // Panggil API
    const result = await callGeminiAPI(skills);

    // Tampilkan hasil atau error
    if (result.error) {
        modalContent.innerHTML = `<p class="text-center text-red-500">${result.error}</p>`;
    } else {
        let htmlResult = '<div class="space-y-4">';
        result.projectIdeas.forEach(idea => {
            htmlResult += `
                <div class="border border-slate-700 p-4 rounded-lg">
                    <h4 class="font-bold text-lg accent-color">${idea.projectName}</h4>
                    <p class="text-gray-300">${idea.description}</p>
                </div>
            `;
        });
        htmlResult += '</div>';
        modalContent.innerHTML = htmlResult;
    }
});

closeModalBtn.addEventListener('click', () => {
    aiModal.style.display = 'none';
});

