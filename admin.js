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

let appSettings = {};

// Check session on load
document.addEventListener('DOMContentLoaded', () => {
    // Restrict admin panel to localhost only
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
    
    if (!isLocalhost) {
        adminAuthContainer.innerHTML = `
            <div class="auth-card" style="max-width: 500px;">
                <img src="emergenstudioLOGO.svg" alt="Emergen Studio Logo">
                <h2>Admin Disabled Online</h2>
                <p style="margin-bottom: 24px;">For security and technical reasons, the Admin Dashboard can only be accessed locally (on your own computer).</p>
                <div style="background: var(--bg-body); padding: 16px; border-radius: var(--radius-sm); text-align: left; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 24px;">
                    <strong>How to update your site:</strong><br><br>
                    1. Run <code>.\\server.ps1</code> on your computer.<br>
                    2. Go to <code>http://localhost:8080/admin.html</code> to make changes.<br>
                    3. Run the <code>update.ps1</code> script to push changes to Vercel.
                </div>
                <a href="index.html" class="btn btn-primary" style="width: 100%; padding: 12px; text-decoration: none;">Return to Live Site</a>
            </div>
        `;
        adminAuthContainer.classList.remove('hidden');
        adminDashboardContainer.classList.add('hidden');
        return;
    }

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

async function showDashboard() {
    adminAuthContainer.classList.add('hidden');
    adminDashboardContainer.classList.remove('hidden');
    await fetchSettings();
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
// API Interaction
// ==========================================

async function fetchSettings() {
    try {
        const response = await fetch('database.json');
        if (response.ok) {
            appSettings = await response.json();
        }
    } catch (e) {
        console.error('Failed to fetch settings', e);
    }
}

async function uploadFile(file) {
    if (!file) return null;
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'X-Filename': encodeURIComponent(file.name) },
            body: file
        });
        if (response.ok) {
            const data = await response.json();
            return data.path;
        }
    } catch (e) {
        console.error('Failed to upload file', e);
    }
    return null;
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
    const videoType = appSettings.videoType || 'url';
    const videoUrl = appSettings.videoUrl || '';
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
    document.getElementById('socialInstagram').value = appSettings.socialInstagram || '';
    document.getElementById('socialLinkedin').value = appSettings.socialLinkedin || '';
    document.getElementById('socialX').value = appSettings.socialX || '';

    // 3. Hero Stats
    document.getElementById('heroRoi').value = appSettings.heroRoi || '+248%';
    document.getElementById('heroLeads').value = appSettings.heroLeads || '1,284';
    document.getElementById('heroAccounts').value = appSettings.heroAccounts || '3.7M';

    // 4. About Us
    const defaultAbout = 'Emergen Studio is built on a simple philosophy: beautiful design should drive measurable results. We are a startup-inspired agency that moves fast, creates premium experiences, and optimizes for growth.';
    document.getElementById('aboutParagraph').value = appSettings.aboutParagraph || defaultAbout;
    
    document.getElementById('aboutStat1').value = appSettings.aboutStat1 || '50+';
    document.getElementById('aboutLabel1').value = appSettings.aboutLabel1 || 'Brands Scaled';
    document.getElementById('aboutStat2').value = appSettings.aboutStat2 || '10M+';
    document.getElementById('aboutLabel2').value = appSettings.aboutLabel2 || 'Ad Spend Managed';
    document.getElementById('aboutStat3').value = appSettings.aboutStat3 || '200+';
    document.getElementById('aboutLabel3').value = appSettings.aboutLabel3 || 'Campaigns';

    // 5. Portfolio
    document.getElementById('workTitle1').value = appSettings.workTitle1 || 'Fitness Empire';
    document.getElementById('workDesc1').value = appSettings.workDesc1 || 'Performance Marketing & Content';
    
    document.getElementById('workTitle2').value = appSettings.workTitle2 || 'Café De Kolkata';
    document.getElementById('workDesc2').value = appSettings.workDesc2 || 'Branding & Social Media';
    
    document.getElementById('workTitle3').value = appSettings.workTitle3 || 'Urban Threads';
    document.getElementById('workDesc3').value = appSettings.workDesc3 || 'E-commerce Website & Ads';

    // 6. Marquee Brands
    const defaultMarquee = 'CAFÉ | DE KOLKATA, FITNESS | EMPIRE, The | Bakeshop, URBAN | THREADS, HOUSE OF | LUXE, GRILL | NATION';
    document.getElementById('marqueeBrands').value = appSettings.marqueeBrands || defaultMarquee;

    // 7. Audit Form Settings
    document.getElementById('googleSheetUrl').value = appSettings.googleSheetUrl || '';
}

// Save Settings
if (adminDashboardForm) {
    adminDashboardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const topBtn = document.getElementById('adminSaveAllBtnTop');
        const bottomBtn = document.getElementById('adminSaveAllBtnBottom');
        
        if(topBtn) topBtn.disabled = true;
        if(bottomBtn) bottomBtn.disabled = true;

        // Video Settings
        const selectedVideoType = document.querySelector('input[name="videoSource"]:checked').value;
        appSettings.videoType = selectedVideoType;
        
        if (selectedVideoType === 'url') {
            appSettings.videoUrl = document.getElementById('adminVideoUrl').value.trim();
        } else if (selectedVideoType === 'file') {
            const file = document.getElementById('adminVideoFile').files[0];
            if (file) {
                const path = await uploadFile(file);
                if (path) appSettings.uploadedVideoPath = path;
            }
        }

        // Social Links
        appSettings.socialInstagram = document.getElementById('socialInstagram').value.trim();
        appSettings.socialLinkedin = document.getElementById('socialLinkedin').value.trim();
        appSettings.socialX = document.getElementById('socialX').value.trim();

        // Hero Stats
        appSettings.heroRoi = document.getElementById('heroRoi').value.trim();
        appSettings.heroLeads = document.getElementById('heroLeads').value.trim();
        appSettings.heroAccounts = document.getElementById('heroAccounts').value.trim();

        // About Us
        appSettings.aboutParagraph = document.getElementById('aboutParagraph').value.trim();
        
        appSettings.aboutStat1 = document.getElementById('aboutStat1').value.trim();
        appSettings.aboutLabel1 = document.getElementById('aboutLabel1').value.trim();
        appSettings.aboutStat2 = document.getElementById('aboutStat2').value.trim();
        appSettings.aboutLabel2 = document.getElementById('aboutLabel2').value.trim();
        appSettings.aboutStat3 = document.getElementById('aboutStat3').value.trim();
        appSettings.aboutLabel3 = document.getElementById('aboutLabel3').value.trim();

        // Portfolio
        appSettings.workTitle1 = document.getElementById('workTitle1').value.trim();
        appSettings.workDesc1 = document.getElementById('workDesc1').value.trim();
        appSettings.workTitle2 = document.getElementById('workTitle2').value.trim();
        appSettings.workDesc2 = document.getElementById('workDesc2').value.trim();
        appSettings.workTitle3 = document.getElementById('workTitle3').value.trim();
        appSettings.workDesc3 = document.getElementById('workDesc3').value.trim();

        // Portfolio Images
        const img1 = document.getElementById('workImg1').files[0];
        if (img1) {
            const path1 = await uploadFile(img1);
            if (path1) appSettings.workImage1Path = path1;
        }
        
        const img2 = document.getElementById('workImg2').files[0];
        if (img2) {
            const path2 = await uploadFile(img2);
            if (path2) appSettings.workImage2Path = path2;
        }

        const img3 = document.getElementById('workImg3').files[0];
        if (img3) {
            const path3 = await uploadFile(img3);
            if (path3) appSettings.workImage3Path = path3;
        }

        // Marquee Brands
        appSettings.marqueeBrands = document.getElementById('marqueeBrands').value.trim();

        // Audit Form Settings
        appSettings.googleSheetUrl = document.getElementById('googleSheetUrl').value.trim();

        // Save everything to the backend
        try {
            await fetch('/api/settings', {
                method: 'POST',
                body: JSON.stringify(appSettings)
            });
        } catch (err) {
            console.error('Failed to save settings', err);
            alert('Error saving settings to the server.');
        }

        // Show Success
        if(topBtn) topBtn.disabled = false;
        if(bottomBtn) bottomBtn.disabled = false;
        
        saveSuccessMsg.style.display = 'block';
        setTimeout(() => {
            saveSuccessMsg.style.display = 'none';
        }, 3000);
    });
}
