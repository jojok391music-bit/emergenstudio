// ==========================================
// Admin Page Logic (Auth & Settings)
// ==========================================

const SECURE_PASSCODE = 'emergen2026';

// DOM Elements
const adminAuthContainer = document.getElementById('adminAuthContainer');
const adminDashboardContainer = document.getElementById('adminDashboardContainer');
const adminAuthForm = document.getElementById('adminAuthForm');
const adminPasscode = document.getElementById('adminPasscode');
const authError = document.getElementById('authError');
const adminDashboardForm = document.getElementById('adminDashboardForm');
const saveSuccessMsg = document.getElementById('saveSuccessMsg');

// Check session on load
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        showDashboard();
    } else {
        showAuth();
    }
});

function showAuth() {
    adminAuthContainer.classList.remove('hidden');
    adminDashboardContainer.classList.add('hidden');
    adminPasscode.value = '';
    authError.classList.add('hidden');
}

function showDashboard() {
    adminAuthContainer.classList.add('hidden');
    adminDashboardContainer.classList.remove('hidden');
    loadSettingsIntoForm();
}

function lockAdminPanel() {
    sessionStorage.removeItem('isAdminAuthenticated');
    showAuth();
}

// Passcode Submission
if (adminAuthForm) {
    adminAuthForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (adminPasscode.value === SECURE_PASSCODE) {
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            authError.classList.add('hidden');
            showDashboard();
        } else {
            authError.classList.remove('hidden');
            adminPasscode.value = '';
            adminPasscode.focus();
        }
    });
}

// ==========================================
// IndexedDB for Video Uploads
// ==========================================
const DB_NAME = 'EmergenStudioDB';
const STORE_NAME = 'VideoStore';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveMediaBlob(blob, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(blob, key);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveVideoBlob(blob) {
    return saveMediaBlob(blob, 'uploadedVideo');
}

// ==========================================
// Dashboard Form Management
// ==========================================

// Video Radio Toggles
const sourceUrlRadio = document.getElementById('sourceUrl');
const sourceFileRadio = document.getElementById('sourceFile');
const urlInputContainer = document.getElementById('urlInputContainer');
const fileInputContainer = document.getElementById('fileInputContainer');

if (sourceUrlRadio && sourceFileRadio) {
    sourceUrlRadio.addEventListener('change', () => {
        urlInputContainer.classList.remove('hidden');
        fileInputContainer.classList.add('hidden');
    });
    
    sourceFileRadio.addEventListener('change', () => {
        urlInputContainer.classList.add('hidden');
        fileInputContainer.classList.remove('hidden');
    });
}

// Load Settings
function loadSettingsIntoForm() {
    // 1. Video
    const videoType = localStorage.getItem('videoType') || 'url';
    const videoUrl = localStorage.getItem('videoUrl') || '';
    if (videoType === 'url') {
        sourceUrlRadio.checked = true;
        urlInputContainer.classList.remove('hidden');
        fileInputContainer.classList.add('hidden');
    } else {
        sourceFileRadio.checked = true;
        urlInputContainer.classList.add('hidden');
        fileInputContainer.classList.remove('hidden');
    }
    document.getElementById('adminVideoUrl').value = videoUrl;

    // 2. Social Links
    document.getElementById('socialInstagram').value = localStorage.getItem('socialInstagram') || '';
    document.getElementById('socialLinkedin').value = localStorage.getItem('socialLinkedin') || '';
    document.getElementById('socialX').value = localStorage.getItem('socialX') || '';

    // 3. Hero Stats
    document.getElementById('heroRoi').value = localStorage.getItem('heroRoi') || '+248%';
    document.getElementById('heroLeads').value = localStorage.getItem('heroLeads') || '1,284';
    document.getElementById('heroAccounts').value = localStorage.getItem('heroAccounts') || '3.7M';

    // 4. About Us
    const defaultAbout = 'Emergen Studio is built on a simple philosophy: beautiful design should drive measurable results. We are a startup-inspired agency that moves fast, creates premium experiences, and optimizes for growth.';
    document.getElementById('aboutParagraph').value = localStorage.getItem('aboutParagraph') || defaultAbout;
    
    document.getElementById('aboutStat1').value = localStorage.getItem('aboutStat1') || '50+';
    document.getElementById('aboutLabel1').value = localStorage.getItem('aboutLabel1') || 'Brands Scaled';
    document.getElementById('aboutStat2').value = localStorage.getItem('aboutStat2') || '10M+';
    document.getElementById('aboutLabel2').value = localStorage.getItem('aboutLabel2') || 'Ad Spend Managed';
    document.getElementById('aboutStat3').value = localStorage.getItem('aboutStat3') || '200+';
    document.getElementById('aboutLabel3').value = localStorage.getItem('aboutLabel3') || 'Campaigns';

    // 5. Portfolio
    document.getElementById('workTitle1').value = localStorage.getItem('workTitle1') || 'Fitness Empire';
    document.getElementById('workDesc1').value = localStorage.getItem('workDesc1') || 'Performance Marketing & Content';
    
    document.getElementById('workTitle2').value = localStorage.getItem('workTitle2') || 'Café De Kolkata';
    document.getElementById('workDesc2').value = localStorage.getItem('workDesc2') || 'Branding & Social Media';
    
    document.getElementById('workTitle3').value = localStorage.getItem('workTitle3') || 'Urban Threads';
    document.getElementById('workDesc3').value = localStorage.getItem('workDesc3') || 'E-commerce Website & Ads';

    // 6. Marquee Brands
    const defaultMarquee = 'CAFÉ | DE KOLKATA, FITNESS | EMPIRE, The | Bakeshop, URBAN | THREADS, HOUSE OF | LUXE, GRILL | NATION';
    document.getElementById('marqueeBrands').value = localStorage.getItem('marqueeBrands') || defaultMarquee;
}

// Save Settings
if (adminDashboardForm) {
    adminDashboardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const topBtn = document.getElementById('adminSaveAllBtnTop');
        const bottomBtn = document.getElementById('adminSaveAllBtnBottom');
        
        if(topBtn) topBtn.disabled = true;
        if(bottomBtn) bottomBtn.disabled = true;

        // Save Video Settings
        const selectedVideoType = document.querySelector('input[name="videoSource"]:checked').value;
        localStorage.setItem('videoType', selectedVideoType);
        
        if (selectedVideoType === 'url') {
            localStorage.setItem('videoUrl', document.getElementById('adminVideoUrl').value.trim());
        } else if (selectedVideoType === 'file') {
            const file = document.getElementById('adminVideoFile').files[0];
            if (file) {
                try {
                    await saveVideoBlob(file);
                } catch (err) {
                    console.error('IndexedDB Save Error', err);
                    alert('Error saving the video file.');
                }
            }
        }

        // Save Social Links
        localStorage.setItem('socialInstagram', document.getElementById('socialInstagram').value.trim());
        localStorage.setItem('socialLinkedin', document.getElementById('socialLinkedin').value.trim());
        localStorage.setItem('socialX', document.getElementById('socialX').value.trim());

        // Save Hero Stats
        localStorage.setItem('heroRoi', document.getElementById('heroRoi').value.trim());
        localStorage.setItem('heroLeads', document.getElementById('heroLeads').value.trim());
        localStorage.setItem('heroAccounts', document.getElementById('heroAccounts').value.trim());

        // Save About Us
        localStorage.setItem('aboutParagraph', document.getElementById('aboutParagraph').value.trim());
        
        localStorage.setItem('aboutStat1', document.getElementById('aboutStat1').value.trim());
        localStorage.setItem('aboutLabel1', document.getElementById('aboutLabel1').value.trim());
        localStorage.setItem('aboutStat2', document.getElementById('aboutStat2').value.trim());
        localStorage.setItem('aboutLabel2', document.getElementById('aboutLabel2').value.trim());
        localStorage.setItem('aboutStat3', document.getElementById('aboutStat3').value.trim());
        localStorage.setItem('aboutLabel3', document.getElementById('aboutLabel3').value.trim());

        // Save Portfolio
        localStorage.setItem('workTitle1', document.getElementById('workTitle1').value.trim());
        localStorage.setItem('workDesc1', document.getElementById('workDesc1').value.trim());
        localStorage.setItem('workTitle2', document.getElementById('workTitle2').value.trim());
        localStorage.setItem('workDesc2', document.getElementById('workDesc2').value.trim());
        localStorage.setItem('workTitle3', document.getElementById('workTitle3').value.trim());
        localStorage.setItem('workDesc3', document.getElementById('workDesc3').value.trim());

        // Save Portfolio Images
        const img1 = document.getElementById('workImg1').files[0];
        if (img1) await saveMediaBlob(img1, 'workImage1');
        
        const img2 = document.getElementById('workImg2').files[0];
        if (img2) await saveMediaBlob(img2, 'workImage2');

        const img3 = document.getElementById('workImg3').files[0];
        if (img3) await saveMediaBlob(img3, 'workImage3');

        // Save Marquee Brands
        localStorage.setItem('marqueeBrands', document.getElementById('marqueeBrands').value.trim());

        // Show Success
        if(topBtn) topBtn.disabled = false;
        if(bottomBtn) bottomBtn.disabled = false;
        
        saveSuccessMsg.style.display = 'block';
        setTimeout(() => {
            saveSuccessMsg.style.display = 'none';
        }, 3000);
    });
}
