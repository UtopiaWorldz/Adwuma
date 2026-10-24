(function () {
    let client;

    function getClient() {
        if (client) return client;

        const config = window.ADWUMA_CONFIG || {};
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            throw new Error('Add your Supabase project URL and anon key to adwuma-config.js.');
        }
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            throw new Error('Supabase could not be loaded. Check your internet connection and reload.');
        }

        client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        return client;
    }

    function getDisplayName(user) {
        return user.user_metadata?.name || user.email?.split('@')[0] || 'Member';
    }

    function toOpportunity(row) {
        const hasStructuredContact = row.whatsapp || row.instagram || row.email || row.phone;
        return {
            id: row.id,
            type: row.type,
            location: row.location,
            title: row.title,
            description: row.description,
            responsibilities: row.responsibilities || '',
            schedule: row.schedule || '',
            contact: hasStructuredContact ? '' : row.contact,
            whatsapp: row.whatsapp || '',
            instagram: row.instagram || '',
            email: row.email || '',
            phone: row.phone || (hasStructuredContact ? '' : row.contact || ''),
            pay: row.pay || '',
            author: row.author_name,
            postedAt: new Date(row.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
        };
    }

    window.Adwuma = {
        getClient,
        getDisplayName,

        appendContactLinks(container, opportunity) {
            const contacts = [
                {
                    label: 'WhatsApp',
                    value: opportunity.whatsapp,
                    href(value) {
                        let digits = value.replace(/\D/g, '');
                        if (digits.startsWith('0')) digits = '233' + digits.slice(1);
                        if (digits.length < 7) return '';
                        return 'https://wa.me/' + digits;
                    }
                },
                {
                    label: 'Instagram',
                    value: opportunity.instagram,
                    href(value) {
                        const input = value.trim();
                        let handle = input;
                        if (/^https?:\/\//i.test(input)) {
                            let profile;
                            try {
                                profile = new URL(input);
                            } catch {
                                return '';
                            }
                            if (!/^(www\.)?instagram\.com$/i.test(profile.hostname)) return '';
                            handle = profile.pathname.split('/').filter(Boolean)[0] || '';
                        }
                        handle = handle.replace(/^@/, '');
                        return /^[A-Za-z0-9._]{1,30}$/.test(handle)
                            ? 'https://www.instagram.com/' + encodeURIComponent(handle) + '/'
                            : '';
                    }
                },
                {
                    label: 'Gmail',
                    value: opportunity.email || opportunity.contact,
                    href(value) {
                        const email = value.trim();
                        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                            ? 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email)
                            : '';
                    }
                },
                {
                    label: 'Call',
                    value: opportunity.phone || opportunity.contact,
                    href(value) {
                        let digits = value.replace(/[^\d+]/g, '');
                        if (digits.startsWith('0')) digits = '+233' + digits.slice(1);
                        return /^\+?\d{7,15}$/.test(digits) ? 'tel:' + digits : '';
                    }
                }
            ];

            const links = contacts
                .map(contact => ({ ...contact, url: contact.value ? contact.href(contact.value) : '' }))
                .filter(contact => contact.url);

            const contactGroup = document.createElement('div');
            contactGroup.className = 'contact-links';
            if (links.length === 0) {
                const unavailable = document.createElement('span');
                unavailable.className = 'contact-unavailable';
                unavailable.textContent = 'No contact details provided';
                contactGroup.appendChild(unavailable);
            } else {
                links.forEach(contact => {
                    const link = document.createElement('a');
                    link.className = 'contact-link';
                    link.href = contact.url;
                    link.textContent = contact.label;
                    if (contact.url.startsWith('https://')) {
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                    }
                    contactGroup.appendChild(link);
                });
            }
            container.appendChild(contactGroup);
        },

        async loadOpportunities() {
            const { data, error } = await getClient()
                .from('opportunities')
                .select('id, type, location, title, description, responsibilities, schedule, contact, whatsapp, instagram, email, phone, pay, author_name, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data.map(toOpportunity);
        },

        async createOpportunity(opportunity) {
            const supabase = getClient();
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('Your sign-in has expired. Please log in again before posting.');

            const { error } = await supabase.from('opportunities').insert({
                author_id: user.id,
                author_name: getDisplayName(user),
                type: opportunity.type,
                location: opportunity.location,
                title: opportunity.title,
                description: opportunity.description,
                responsibilities: opportunity.responsibilities,
                schedule: opportunity.schedule,
                contact: opportunity.phone || opportunity.email || opportunity.whatsapp || opportunity.instagram || '',
                whatsapp: opportunity.whatsapp,
                instagram: opportunity.instagram,
                email: opportunity.email,
                phone: opportunity.phone,
                pay: opportunity.pay
            });

            if (error) throw error;
        },

        async logout() {
            localStorage.removeItem('adwuma_user');
            let signOutError;
            try {
                const config = window.ADWUMA_CONFIG || {};
                if (config.supabaseUrl && config.supabaseAnonKey) {
                    const { error } = await getClient().auth.signOut();
                    if (error) signOutError = error;
                }
            } catch (error) {
                signOutError = error;
            }

            if (signOutError) window.alert('Could not sign out cleanly: ' + signOutError.message);
            window.location.href = 'homepage.html';
        }
    };
})();
