function extractUnsubscribeLink(headers, htmlBody, textBody) {
  const getHeader = (name) => {
    const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : null;
  };

  const listUnsub = getHeader('List-Unsubscribe');
  let link = null;

  if (listUnsub) {
    const urlMatch = listUnsub.match(/<([^>]+)>/g);
    if (urlMatch) {
        for (let m of urlMatch) {
            const cleanUrl = m.replace(/[<>]/g, '').trim();
            if (cleanUrl.startsWith('http')) {
                link = cleanUrl;
                break;
            }
        }
    }
    if (!link) {
      const directUrl = listUnsub.match(/https?:\/\/[^\s,<>]+/);
      if (directUrl) link = directUrl[0];
    }
  }

  if (!link && htmlBody) {
    const keywords = ['unsubscribe', 'darse de baja', 'opt-out', 'optout', 'cancel', 'preferencias', 'preferences', 'desuscribir', 'dejar de recibir', 'baja', 'mailing list', 'remove'];
    const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = anchorRegex.exec(htmlBody)) !== null) {
      const url = match[1];
      const text = match[2].toLowerCase();
      if (keywords.some(k => text.includes(k))) {
        if (url.startsWith('http')) {
           link = url;
           break;
        }
      }
    }
    if (!link) {
      const imgRegex = /<a[^>]+href=["']([^"']+)["'][^>]*><img[^>]*>/gi;
      while ((match = imgRegex.exec(htmlBody)) !== null) {
        const url = match[1];
        if (url.startsWith('http')) {
          const lower = htmlBody.substring(Math.max(0, match.index - 100), match.index).toLowerCase();
          if (keywords.some(k => lower.includes(k))) {
            link = url;
            break;
          }
        }
      }
    }
  }

  if (!link && textBody) {
    const urlRegex = /(https?:\/\/[^\s]+?(?:unsubscribe|opt.?.out|cancel|baja)[^\s]*)/i;
    const match = textBody.match(urlRegex);
    if (match) link = match[1];
  }

  return link;
}

function classifySender(email, name) {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  
  const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'tiktok.com', 'pinterest.com', 'reddit.com', 'tumblr.com', 'nextdoor.com'];
  if (socialDomains.some(d => domain.includes(d))) return 'social';

  const newsletterDomains = ['substack.com', 'mailchimp.com', 'convertkit.com', 'medium.com', 'beehiiv.com', 'sendgrid.net', 'flodesk.com'];
  if (newsletterDomains.some(d => domain.includes(d))) return 'newsletter';

  if (
    email.includes('promos') || email.includes('marketing') || email.includes('news') || 
    email.includes('offer') || email.includes('reply') || email.includes('hello')
  ) {
    return 'promotions';
  }

  return 'other';
}

function estimateFrequency(dates) {
  if (!dates || dates.length <= 1) return 1;
  dates.sort((a, b) => new Date(a) - new Date(b));
  
  const first = new Date(dates[0]);
  const last = new Date(dates[dates.length - 1]);
  
  const monthsDiff = (last.getFullYear() - first.getFullYear()) * 12 + (last.getMonth() - first.getMonth()) || 1;
  const count = dates.length;
  
  return Math.ceil(count / monthsDiff);
}

function extractTextSnippet(htmlBody, maxLen = 200) {
  if (!htmlBody) return '';
  const stripped = htmlBody
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length > maxLen
    ? stripped.slice(0, maxLen).replace(/\s+\S*$/, '') + '…'
    : stripped;
}

module.exports = {
  extractUnsubscribeLink,
  classifySender,
  estimateFrequency,
  extractTextSnippet
};
