document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const submitBtn = contactForm.querySelector('.submit-btn');
    const messageTextarea = document.getElementById('message');
    const messageCount = document.getElementById('message-count');
    const eventDateInput = document.getElementById('event-date');

    if (!contactForm) return;

    // Set date input constraints
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() + 2);

    eventDateInput.min = today.toISOString().split('T')[0];
    eventDateInput.max = maxDate.toISOString().split('T')[0];

    // Character counter for message
    messageTextarea.addEventListener('input', updateCharacterCount);

    // Real-time validation
    const inputs = contactForm.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });

    contactForm.addEventListener('submit', handleFormSubmission);

    function updateCharacterCount() {
        const current = messageTextarea.value.length;
        const max = 2000;
        messageCount.textContent = current;

        const counter = document.querySelector('.character-count');
        counter.classList.remove('warning', 'error');

        if (current > max * 0.9) {
            counter.classList.add('error');
        } else if (current > max * 0.8) {
            counter.classList.add('warning');
        }
    }

    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Clear previous states
        clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required.';
        }

        // Field-specific validation
        switch (fieldName) {
            case 'name':
                if (value && (value.length < 2 || value.length > 100)) {
                    isValid = false;
                    errorMessage = 'Name must be between 2 and 100 characters.';
                } else if (value && !/^[a-zA-Z\s\-'\.]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Name can only contain letters, spaces, hyphens, and apostrophes.';
                }
                break;

            case 'email':
                if (value && !isValidEmail(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address.';
                }
                break;

            case 'phone':
                if (value && !/^[\+]?[\d\s\-\(\)\.]{10,20}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number.';
                }
                break;

            case 'subject':
                if (value && (value.length < 5 || value.length > 200)) {
                    isValid = false;
                    errorMessage = 'Subject must be between 5 and 200 characters.';
                }
                break;

            case 'message':
                if (value && (value.length < 10 || value.length > 2000)) {
                    isValid = false;
                    errorMessage = 'Message must be between 10 and 2000 characters.';
                }
                break;
        }

        if (!isValid) {
            showFieldError(field, errorMessage);
            field.classList.add('error');
            field.classList.remove('success');
        } else if (value) {
            field.classList.add('success');
            field.classList.remove('error');
        }

        return isValid;
    }

    function showFieldError(field, message) {
        const errorElement = document.getElementById(`${field.name}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    function clearFieldError(field) {
        const errorElement = document.getElementById(`${field.name}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
        field.classList.remove('error', 'success');
    }

    function handleFormSubmission(e) {
        e.preventDefault();

        // Validate all required fields
        let isFormValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            showMessage('Please correct the errors above before submitting.', 'error');
            // Focus on first error
            const firstError = contactForm.querySelector('.error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Get form data
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            shootType: formData.get('shoot-type'),
            budget: formData.get('budget'),
            eventDate: formData.get('event-date'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            newsletter: formData.get('newsletter') === 'on'
        };

        // Show loading state
        setSubmitButtonState(true);

        // Generate mailto link
        const mailtoLink = generateMailtoLink(data);

        // Try to open mailto link
        try {
            window.location.href = mailtoLink;

            // Show success message after a short delay
            setTimeout(() => {
                showMessage('Email client opened! Please send the email to complete your inquiry.', 'success');
                contactForm.reset();
                updateCharacterCount(); // Reset counter
                setSubmitButtonState(false);

                // Clear all field states
                inputs.forEach(clearFieldError);
            }, 500);

        } catch (error) {
            console.error('Error opening email client:', error);

            // Fallback: show copy-to-clipboard option
            showMailtoFallback(data);
            setSubmitButtonState(false);
        }
    }

    function generateMailtoLink(data) {
        const recipient = 'mitchellandersoncarter@gmail.com';

        // Create subject line
        let subject = `Photography Inquiry: ${data.subject}`;
        if (data.shootType) {
            subject += ` (${getShootTypeLabel(data.shootType)})`;
        }

        // Create email body
        const body = `
Hello,

I'm interested in your photography services.

Contact Information:
Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}

Project Details:
${data.shootType ? `Shoot Type: ${getShootTypeLabel(data.shootType)}` : ''}
${data.budget ? `Budget Range: ${getBudgetLabel(data.budget)}` : ''}
${data.eventDate ? `Event Date: ${formatDate(data.eventDate)}` : ''}

Subject: ${data.subject}

Message:
${data.message}

${data.newsletter ? 'I would like to subscribe to photography updates and portfolio highlights.' : ''}

Best regards,
${data.name}

---
This message was sent via your photography website contact form.
        `.trim();

        // Encode components for URL
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);

        return `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
    }

    function getShootTypeLabel(value) {
        const shootTypes = {
            'wedding': 'Wedding Photography',
            'portrait': 'Portrait Session',
            'event': 'Event Photography',
            'corporate': 'Corporate/Business',
            'nature': 'Nature/Landscape',
            'travel': 'Travel Photography',
            'other': 'Other'
        };
        return shootTypes[value] || value;
    }

    function getBudgetLabel(value) {
        const budgets = {
            'under-500': 'Under $500',
            '500-1000': '$500 - $1,000',
            '1000-2500': '$1,000 - $2,500',
            '2500-5000': '$2,500 - $5,000',
            'over-5000': 'Over $5,000',
            'discuss': 'Prefer to discuss'
        };
        return budgets[value] || value;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function showMailtoFallback(data) {
        const fallbackModal = createFallbackModal(data);
        document.body.appendChild(fallbackModal);

        // Show modal with animation
        requestAnimationFrame(() => {
            fallbackModal.classList.add('active');
        });
    }

    function createFallbackModal(data) {
        const modal = document.createElement('div');
        modal.className = 'contact-fallback-modal';

        const mailtoLink = generateMailtoLink(data);
        const emailBody = generateEmailBody(data);

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Email Client Not Available</h3>
                    <button class="close-modal" aria-label="Close modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Your email client couldn't be opened automatically. You can:</p>

                    <div class="fallback-options">
                        <div class="option">
                            <h4>Option 1: Copy Email Details</h4>
                            <p><strong>To:</strong> mitchellandersoncarter@gmail.com</p>
                            <p><strong>Subject:</strong> Photography Inquiry: ${data.subject}</p>
                            <div class="message-preview">
                                <strong>Message:</strong>
                                <textarea readonly rows="8" aria-label="Email message to copy">${emailBody}</textarea>
                            </div>
                            <button class="copy-btn" onclick="copyToClipboard('${emailBody.replace(/'/g, "\\'")}')">
                                Copy Message
                            </button>
                        </div>

                        <div class="option">
                            <h4>Option 2: Try Mailto Link Again</h4>
                            <a href="${mailtoLink}" class="mailto-link-btn">Open Email Client</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => closeModal(modal));

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeModal(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        });

        return modal;
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 300);
    }

    function generateEmailBody(data) {
        return `Hello,

I'm interested in your photography services.

Contact Information:
Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}

Project Details:
${data.shootType ? `Shoot Type: ${getShootTypeLabel(data.shootType)}` : ''}
${data.budget ? `Budget Range: ${getBudgetLabel(data.budget)}` : ''}
${data.eventDate ? `Event Date: ${formatDate(data.eventDate)}` : ''}

Subject: ${data.subject}

Message:
${data.message}

${data.newsletter ? 'I would like to subscribe to photography updates and portfolio highlights.' : ''}

Best regards,
${data.name}

---
This message was sent via your photography website contact form.`;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function setSubmitButtonState(loading) {
        const btnText = submitBtn.querySelector('.btn-text');
        const btnIcon = submitBtn.querySelector('.btn-icon');

        if (loading) {
            submitBtn.disabled = true;
            btnText.textContent = 'Sending...';
            btnIcon.innerHTML = '<span class="spinner"></span>';
            submitBtn.classList.add('loading');
        } else {
            submitBtn.disabled = false;
            btnText.textContent = 'Send Message';
            btnIcon.textContent = '→';
            submitBtn.classList.remove('loading');
        }
    }

    function showMessage(message, type) {
        // Remove existing message
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;

        // Insert after form
        contactForm.insertAdjacentElement('afterend', messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Global function for copy to clipboard (used in modal)
    window.copyToClipboard = function(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showMessage('Message copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    };

    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            showMessage('Message copied to clipboard!', 'success');
        } catch (err) {
            showMessage('Copy failed. Please copy the message manually.', 'error');
        }

        document.body.removeChild(textArea);
    }

    // Initialize character count
    updateCharacterCount();
});