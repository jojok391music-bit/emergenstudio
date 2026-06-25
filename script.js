document.addEventListener('DOMContentLoaded', () => {

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuOverlay.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuOverlay.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });

    // Scroll Reveal Animation (Intersection Observer)
    const revealElements = document.querySelectorAll('.reveal');

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    };

    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

});

// Global Modal Functions
const auditModal = document.getElementById('auditModal');

let popupShown = false;

function openModal() {
    popupShown = true;
    auditModal.classList.add('active');
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    auditModal.classList.remove('active');
    // Restore background scrolling
    document.body.style.overflow = 'auto';
    
    // Reset form view back to display: block after closing transition
    setTimeout(() => {
        const formContainer = document.getElementById('auditFormContainer');
        const successContainer = document.getElementById('auditSuccessContainer');
        if (formContainer && successContainer) {
            formContainer.style.display = 'block';
            successContainer.style.display = 'none';
        }
    }, 400);
}

// Close modal when clicking outside
auditModal.addEventListener('click', (e) => {
    if (e.target === auditModal) {
        closeModal();
    }
});

// Popup modal after 6 seconds of staying on the page
setTimeout(() => {
    if (!popupShown) {
        openModal();
    }
}, 6000);

// Audit Form Submission & Validation
const auditForm = document.getElementById('auditForm');
const auditPhone = document.getElementById('auditPhone');
const auditEmail = document.getElementById('auditEmail');
const auditError = document.getElementById('auditError');
const auditSubmitBtn = document.getElementById('auditSubmitBtn');

if (auditForm) {
    auditForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validation: either phone or email must be provided
        if (!auditPhone.value.trim() && !auditEmail.value.trim()) {
            auditError.style.display = 'block';
            return;
        }

        auditError.style.display = 'none';
        auditSubmitBtn.textContent = 'Submitting...';
        auditSubmitBtn.disabled = true;

        // Google Sheets integration (Apps Script Web App)
        const scriptURL = appSettings.googleSheetUrl;
        
        if (!scriptURL) {
            alert('Google Sheets integration is not configured. Please set the Apps Script URL in the Admin Dashboard.');
            auditSubmitBtn.textContent = 'Request Audit';
            auditSubmitBtn.disabled = false;
            return;
        }

        const formData = new URLSearchParams();
        formData.append('Company', document.getElementById('auditCompany').value);
        formData.append('Phone', auditPhone.value);
        formData.append('Email', auditEmail.value);
        formData.append('Timestamp', new Date().toLocaleString());

        try {
            // Sending the actual network request to Google Apps Script
            await fetch(scriptURL, { method: 'POST', body: formData, mode: 'no-cors' });

            // Reset the form and toggle visibility to success screen
            auditForm.reset();
            const formContainer = document.getElementById('auditFormContainer');
            const successContainer = document.getElementById('auditSuccessContainer');
            if (formContainer && successContainer) {
                formContainer.style.display = 'none';
                successContainer.style.display = 'block';
            }
        } catch (error) {
            alert('Something went wrong. Please try again.');
        } finally {
            auditSubmitBtn.textContent = 'Request Audit';
            auditSubmitBtn.disabled = false;
        }
    });
}

// ==========================================
// Fetch Settings from Server
// ==========================================

let appSettings = {};

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

// Dynamic Video Embed Loader
function loadVideo() {
    const videoType = appSettings.videoType || 'placeholder';
    const videoUrl = appSettings.videoUrl || '';
    const container = document.getElementById('videoContainer');
    
    if (!container) return;
    
    if (videoType === 'url' && videoUrl) {
        let embedSrc = '';
        if (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')) {
            let videoId = '';
            if (videoUrl.includes('youtube.com/watch') || videoUrl.includes('youtube-nocookie.com/watch')) {
                const urlParams = new URLSearchParams(new URL(videoUrl).search);
                videoId = urlParams.get('v');
            } else if (videoUrl.includes('youtu.be/')) {
                videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
            } else if (videoUrl.includes('youtube.com/shorts/') || videoUrl.includes('youtube-nocookie.com/shorts/')) {
                videoId = videoUrl.split('/shorts/')[1].split('?')[0];
            } else if (videoUrl.includes('/embed/')) {
                videoId = videoUrl.split('/embed/')[1].split('?')[0];
            }
            
            if (videoId) {
                embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`;
            }
        } else if (videoUrl.includes('instagram.com')) {
            let cleanUrl = videoUrl.split('?')[0];
            if (!cleanUrl.endsWith('/')) {
                cleanUrl += '/';
            }
            embedSrc = `${cleanUrl}embed/captioned/`;
        } else {
            embedSrc = videoUrl;
        }
        
        if (embedSrc) {
            if (embedSrc.includes('instagram.com')) {
                container.innerHTML = `<iframe src="${embedSrc}" style="width:100%; height:100%; border:none; overflow:hidden;" scrolling="no" allowtransparency="true" allow="autoplay; encrypted-media"></iframe>`;
            } else if (embedSrc.includes('youtube')) {
                container.innerHTML = `<iframe src="${embedSrc}" style="width:100%; height:100%; border:none; object-fit: cover;" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            } else {
                container.innerHTML = `<video src="${embedSrc}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit: cover;"></video>`;
            }
        } else {
            renderPlaceholder();
        }
    } else {
        renderPlaceholder();
    }
}

function renderPlaceholder() {
    const container = document.getElementById('videoContainer');
    if (container) {
        container.innerHTML = `
            <div class="video-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke: var(--accent-purple); fill: rgba(124, 58, 237, 0.2);"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
            </div>
        `;
    }
}

// ==========================================
// Hydrate Dynamic Data from Settings
// ==========================================
function hydrateData() {
    // Hero Stats
    const roi = appSettings.heroRoi;
    if (roi) document.getElementById('stat-roi').innerHTML = `${roi}\n<span class="subtext">vs last 30 days</span>`;
    
    const leads = appSettings.heroLeads;
    if (leads) document.getElementById('stat-leads').innerHTML = `${leads}\n<span class="subtext">+312% vs last 30 days</span>`;
    
    const accounts = appSettings.heroAccounts;
    if (accounts) document.getElementById('stat-accounts').innerHTML = `${accounts}\n<span class="subtext trend-up">+210%</span>`;

    // Social Links
    const instagram = appSettings.socialInstagram;
    if (instagram) document.getElementById('social-instagram').href = instagram;
    
    const linkedin = appSettings.socialLinkedin;
    if (linkedin) document.getElementById('social-linkedin').href = linkedin;
    
    const twitter = appSettings.socialX;
    if (twitter) document.getElementById('social-x').href = twitter;

    // About Paragraph & Stats
    const aboutParagraph = appSettings.aboutParagraph;
    if (aboutParagraph) document.getElementById('about-paragraph').textContent = aboutParagraph;

    const aboutStat1 = appSettings.aboutStat1;
    const aboutLabel1 = appSettings.aboutLabel1;
    if (aboutStat1) document.getElementById('about-stat-num-1').textContent = aboutStat1;
    if (aboutLabel1) document.getElementById('about-stat-label-1').textContent = aboutLabel1;

    const aboutStat2 = appSettings.aboutStat2;
    const aboutLabel2 = appSettings.aboutLabel2;
    if (aboutStat2) document.getElementById('about-stat-num-2').textContent = aboutStat2;
    if (aboutLabel2) document.getElementById('about-stat-label-2').textContent = aboutLabel2;

    const aboutStat3 = appSettings.aboutStat3;
    const aboutLabel3 = appSettings.aboutLabel3;
    if (aboutStat3) document.getElementById('about-stat-num-3').textContent = aboutStat3;
    if (aboutLabel3) document.getElementById('about-stat-label-3').textContent = aboutLabel3;

    // Portfolio
    const workTitle1 = appSettings.workTitle1;
    const workDesc1 = appSettings.workDesc1;
    if (workTitle1) document.getElementById('work-title-1').textContent = workTitle1;
    if (workDesc1) document.getElementById('work-desc-1').textContent = workDesc1;

    const workTitle2 = appSettings.workTitle2;
    const workDesc2 = appSettings.workDesc2;
    if (workTitle2) document.getElementById('work-title-2').textContent = workTitle2;
    if (workDesc2) document.getElementById('work-desc-2').textContent = workDesc2;

    const workTitle3 = appSettings.workTitle3;
    const workDesc3 = appSettings.workDesc3;
    if (workTitle3) document.getElementById('work-title-3').textContent = workTitle3;
    if (workDesc3) document.getElementById('work-desc-3').textContent = workDesc3;

    // Marquee Brands
    const marqueeBrandsStr = appSettings.marqueeBrands;
    if (marqueeBrandsStr) {
        const brandsList = marqueeBrandsStr.split(',').map(b => b.trim()).filter(b => b);
        let marqueeHtml = '';
        for (const brand of brandsList) {
            const parts = brand.split('|').map(p => p.trim());
            if (parts.length > 1) {
                marqueeHtml += `<div class="brand">${parts[0]} <span>${parts[1]}</span></div>\n`;
            } else {
                marqueeHtml += `<div class="brand">${parts[0]}</div>\n`;
            }
        }
        // Duplicate for infinite scroll
        marqueeHtml = marqueeHtml + marqueeHtml;
        
        const marqueeContainer = document.getElementById('marqueeContent');
        if (marqueeContainer) {
            marqueeContainer.innerHTML = marqueeHtml;
        }
    }

    // Portfolio Images
    if (appSettings.workImage1Path) {
        const placeholder = document.querySelector(`.portfolio-item:nth-child(1) .portfolio-img-placeholder`);
        if (placeholder) {
            placeholder.style.backgroundImage = `url(${appSettings.workImage1Path})`;
            placeholder.style.backgroundSize = 'cover';
            placeholder.style.backgroundPosition = 'center';
        }
    }
    if (appSettings.workImage2Path) {
        const placeholder = document.querySelector(`.portfolio-item:nth-child(2) .portfolio-img-placeholder`);
        if (placeholder) {
            placeholder.style.backgroundImage = `url(${appSettings.workImage2Path})`;
            placeholder.style.backgroundSize = 'cover';
            placeholder.style.backgroundPosition = 'center';
        }
    }
    if (appSettings.workImage3Path) {
        const placeholder = document.querySelector(`.portfolio-item:nth-child(3) .portfolio-img-placeholder`);
        if (placeholder) {
            placeholder.style.backgroundImage = `url(${appSettings.workImage3Path})`;
            placeholder.style.backgroundSize = 'cover';
            placeholder.style.backgroundPosition = 'center';
        }
    }
}

// Initial Load on page start
document.addEventListener('DOMContentLoaded', async () => {
    await fetchSettings();
    loadVideo();
    hydrateData();
});

// Hidden shortcut key to open admin page: Ctrl + Shift + A
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.location.href = 'admin.html';
    }
});

