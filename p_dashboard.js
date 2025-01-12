// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // File Upload Handling
    const uploadBox = document.querySelector('.upload-box');
    const fileInput = document.querySelector('input[type="file"]');
    const statusList = document.querySelector('.status-list');

    uploadBox.addEventListener('click', () => {
        fileInput.click();
    });

    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--accent-color)';
        uploadBox.style.backgroundColor = 'rgba(66, 153, 225, 0.1)';
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.borderColor = 'var(--accent-color)';
        uploadBox.style.backgroundColor = 'var(--white)';
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--accent-color)';
        uploadBox.style.backgroundColor = 'var(--white)';
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            // Create status item
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            statusItem.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: 0%"></div>
                </div>
            `;
            statusList.prepend(statusItem);

            // Simulate upload progress
            simulateUpload(statusItem.querySelector('.progress'));
        });
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function simulateUpload(progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
        }, 200);
    }

    // Notification Panel
    const notificationToggle = document.querySelector('.notification-toggle');
    const notificationPanel = document.querySelector('.notification-panel');
    const closeBtn = document.querySelector('.close-btn');

    if (notificationToggle) {
        notificationToggle.addEventListener('click', () => {
            notificationPanel.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notificationPanel.classList.remove('active');
        });
    }

    // Appointment Tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Add logic to switch between upcoming and past appointments
        });
    });

    // QR Code Generation
    const qrForm = document.getElementById('qrForm');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const qrActions = document.querySelector('.qr-actions');
    const downloadQR = document.getElementById('downloadQR');
    const shareQR = document.getElementById('shareQR');

    if (qrForm) {
        qrForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const phoneNumber = document.getElementById('phoneNumber').value;

            try {
                const response = await fetch('http://localhost:3000/generate-qr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        phoneNumber,
                        patientInfo: {
                            name: "John Doe",
                            age: "32",
                            emergencyContact: phoneNumber
                        }
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    qrCodeContainer.innerHTML = `
                        <img src="${data.qrCodeUrl}" alt="QR Code" class="qr-image">
                    `;
                    qrActions.style.display = 'flex'; // Show download/share buttons
                } else {
                    qrCodeContainer.innerHTML = `<p class="error-message">Error generating QR code.</p>`;
                    qrActions.style.display = 'none';
                }
            } catch (error) {
                console.error('Error:', error);
                qrCodeContainer.innerHTML = `<p class="error-message">An error occurred. Please try again.</p>`;
                qrActions.style.display = 'none';
            }
        });
    }

    // Download QR Code
    if (downloadQR) {
        downloadQR.addEventListener('click', () => {
            const qrImage = qrCodeContainer.querySelector('img');
            if (qrImage) {
                const link = document.createElement('a');
                link.href = qrImage.src;
                link.download = 'medical-qr-code.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }

    // Share QR Code
    if (shareQR) {
        shareQR.addEventListener('click', async () => {
            const qrImage = qrCodeContainer.querySelector('img');
            if (qrImage) {
                try {
                    const response = await fetch(qrImage.src);
                    const blob = await response.blob();
                    const file = new File([blob], 'qr-code.png', { type: 'image/png' });
                    
                    if (navigator.share) {
                        await navigator.share({
                            title: 'My Medical QR Code',
                            text: 'Scan this QR code to access my medical information',
                            files: [file]
                        });
                    } else {
                        alert('Sharing is not supported on this browser. You can download the QR code instead.');
                    }
                } catch (error) {
                    console.error('Error sharing:', error);
                    alert('Could not share the QR code. You can download it instead.');
                }
            }
        });
    }

    // QR Code Actions
    const downloadQRCode = document.querySelector('.qr-actions .btn:first-child');
    const shareQRCode = document.querySelector('.qr-actions .btn:last-child');

    if (downloadQRCode) {
        downloadQRCode.addEventListener('click', () => {
            // Add logic to download QR code
            console.log('Downloading QR code...');
        });
    }

    if (shareQRCode) {
        shareQRCode.addEventListener('click', () => {
            // Add logic to share QR code
            console.log('Sharing QR code...');
        });
    }

    // Emergency Call Button
    const emergencyBtn = document.querySelector('.emergency-btn');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', () => {
            // Add logic for emergency call
            console.log('Emergency call initiated...');
        });
    }
});

// Add sample notifications (this would normally come from a backend)
function addSampleNotifications() {
    const notificationList = document.querySelector('.notification-list');
    const notifications = [
        {
            title: 'Upcoming Appointment',
            message: 'You have an appointment with Dr. Sarah Johnson tomorrow at 10:00 AM',
            time: '1 hour ago'
        },
        {
            title: 'New Test Results',
            message: 'Your blood test results are now available',
            time: '2 hours ago'
        },
        {
            title: 'Prescription Refill',
            message: 'Your prescription for Amoxicillin needs to be refilled',
            time: '1 day ago'
        }
    ];

    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        notificationItem.innerHTML = `
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
            <span class="time">${notification.time}</span>
        `;
        notificationList.appendChild(notificationItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const phoneNumberInput = document.getElementById('phoneNumberInput');
    const patientName = document.getElementById('patientName');
    const patientAge = document.getElementById('patientAge');
    const patientGender = document.getElementById('patientGender');
    const welcomeMessage = document.querySelector('.hero h1');

    fetchDataBtn.addEventListener('click', async () => {
        const phoneNumber = phoneNumberInput.value.trim();

        if (phoneNumber) {
            try {
                const response = await fetch(`http://localhost:3000/get-patient/${phoneNumber}`);
                const data = await response.json();

                if (response.ok) {
                    // Update the profile info with the fetched data
                    patientName.textContent = data.patient.name;
                    patientAge.textContent = data.patient.age;
                    patientGender.textContent = data.patient.gender;
                    
                    // Update welcome message
                    welcomeMessage.textContent = `Welcome Back, ${data.patient.name}`;
                    
                    // Add animation class
                    welcomeMessage.style.animation = 'none';
                    welcomeMessage.offsetHeight; // Trigger reflow
                    welcomeMessage.style.animation = 'fadeInUp 0.5s ease forwards';
                } else {
                    alert(data.message || 'Patient not found.');
                }
            } catch (error) {
                console.error('Error fetching patient data:', error);
                alert('An error occurred while fetching the data.');
            }
        } else {
            alert('Please enter a phone number.');
        }
    });

    // QR Code Generation
    const qrForm = document.getElementById('qrForm');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const qrActions = document.querySelector('.qr-actions');

    qrForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();

        if (phoneNumber) {
            try {
                const response = await fetch('http://localhost:3000/generate-qr', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        phoneNumber,
                        patientName: patientName.textContent,
                        patientAge: patientAge.textContent,
                        patientGender: patientGender.textContent
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    // Display QR code
                    qrCodeContainer.innerHTML = `<img src="${data.qrCodeUrl}" alt="QR Code">`;
                    qrActions.style.display = 'flex';
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to generate QR code');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while generating the QR code');
            }
        } else {
            alert('Please enter a phone number');
        }
    });

    // Download QR Code
    const downloadQR = document.getElementById('downloadQR');
    downloadQR.addEventListener('click', () => {
        const qrImage = qrCodeContainer.querySelector('img');
        if (qrImage) {
            const link = document.createElement('a');
            link.href = qrImage.src;
            link.download = 'medical-qr-code.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    // Share QR Code
    const shareQR = document.getElementById('shareQR');
    shareQR.addEventListener('click', async () => {
        const qrImage = qrCodeContainer.querySelector('img');
        if (qrImage && navigator.share) {
            try {
                await navigator.share({
                    title: 'Medical QR Code',
                    text: 'Here is my medical QR code',
                    url: qrImage.src
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            alert('Sharing is not supported on this device/browser');
        }
    });
});

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', addSampleNotifications);
