/* Telegram direct sender — fallback when PHP backend unavailable (GitHub Pages) */
window.__TG = {
  t: '7134890614:AAEGEZXYV5aQrtlmwONkxe-IwUeJbk-GhgE',
  c: '-1002058569513',

  async send(text) {
    const res = await fetch('https://api.telegram.org/bot' + this.t + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: this.c, text: text, parse_mode: 'Markdown' }),
    });
    return res.json();
  },

  formatQuiz(branch, answers, services, contact) {
    const label = branch === 'nosite' ? '[Без сайту]' : '[Діючий магазин]';
    const qMap = {
      root:        'Що у вас зараз?',
      ns_what:     'Що продаєте?',
      ns_where:    'Де зараз продаєте?',
      ns_count:    'Скільки товарів?',
      hs_need:     'Що потрібно?',
      hs_where:    'Де продаєте?',
      hs_time:     'Що забирає найбільше часу?',
      hs_platform: 'На чому ваш сайт?',
      hs_fix:      'Що доробити?',
    };

    let text = '🏷 *' + label + ' · квіз* Нова заявка\n\n';
    text += '📱 *Контакт:* ' + contact + '\n';

    for (var key in qMap) {
      if (!answers[key]) continue;
      var val = Array.isArray(answers[key]) ? answers[key].join(', ') : answers[key];
      text += '*' + qMap[key] + ':* ' + val + '\n';
    }

    if (services && services.length) {
      text += '\n🔧 *Підібрані послуги:*\n';
      services.forEach(function(s) { text += '— ' + s + '\n'; });
    }

    return text;
  },

  formatContact(name, what, contact) {
    return '🏷 *[Сайт]* Нова заявка\n\n'
      + '🏪 *Назва бізнесу:* ' + name + '\n'
      + '📦 *Що продає:* ' + what + '\n'
      + '📱 *Контакт:* ' + contact;
  },

  formatAuto(name, where, services, contact) {
    return '🏷 *[Автоматизація]* Нова заявка\n\n'
      + '🏪 *Назва магазину:* ' + name + '\n'
      + '🛒 *Де продає:* ' + where + '\n'
      + '🛠 *Послуги:* ' + services + '\n'
      + '📱 *Контакт:* ' + contact;
  },
};
