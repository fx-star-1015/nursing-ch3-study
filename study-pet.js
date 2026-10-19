(() => {
  if (document.querySelector('.study-pet')) return;
  const petImage = new URL('assets/study-pet-v1.png', document.currentScript.src).href;
  const lines = [
    '先把年龄、时间和症状圈出来，再判断它到底在考什么。',
    '今天不用清空所有任务，真正拿下一页就很棒。',
    '暂时不会很正常，能说出“为什么”就是进步。',
    '别急着背答案，先把决定判断的那条线索说出来。',
    '这题又来装熟人了，看看它悄悄换了哪个条件。',
    '错题不是在嘲笑你，它是在考前替你排雷。',
    '数值别单独背：对象、条件和单位要一起带走。',
    '看累了就眨眨眼，我替你守住这一页。',
    '再做三题，就允许你理直气壮地休息五分钟。',
    '护理措施先排生命与安全，再处理舒适和长期问题。',
    '选项都像对的？回到病人此刻最急的问题。',
    '你不是记不住，只是还没把知识放进逻辑链。',
    '今天多会一个考点，考场上就多一分底气。'
  ];
  const style = document.createElement('style');
  style.textContent = `
    .study-pet{position:fixed!important;right:18px!important;top:18px!important;bottom:auto!important;left:auto!important;z-index:9999;display:flex;align-items:flex-start;gap:6px;filter:drop-shadow(0 10px 14px #4c357028)}
    .study-pet-host{position:relative!important;padding-right:390px!important;min-height:190px}
    .study-pet--hero{position:absolute!important;right:18px!important;top:18px!important;bottom:auto!important;left:auto!important}
    .study-pet-character{width:112px;height:112px;border:0;padding:0;background:transparent;cursor:pointer;transform-origin:50% 100%;animation:pet-bob 3.6s ease-in-out infinite;image-rendering:pixelated}
    .study-pet-character img{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none}
    .study-pet-bubble{position:relative;max-width:244px;margin-top:28px;padding:11px 32px 11px 13px;border:1px solid #d9cdf1;border-radius:15px 4px 15px 15px;background:#fff;color:#302742;box-shadow:0 10px 28px #60479322;font-size:14px;line-height:1.55;animation:bubble-in .28s ease-out}
    .study-pet-bubble::after{content:'';position:absolute;right:-8px;top:12px;width:15px;height:15px;background:#fff;border-right:1px solid #d9cdf1;border-bottom:1px solid #d9cdf1;transform:rotate(-45deg)}
    .study-pet-close{position:absolute;top:3px;right:5px;width:25px;height:25px;border:0;background:transparent;color:#8a7b9c;font-size:18px;cursor:pointer}
    .study-pet-hint{position:absolute;right:15px;top:105px;padding:2px 7px;border-radius:99px;background:#fff;color:#7151b7;font-size:10px;font-weight:800;opacity:0;transition:.2s;pointer-events:none}
    .study-pet:hover .study-pet-hint{opacity:1;transform:translateY(-2px)}
    @keyframes pet-bob{0%,100%{transform:translateY(0) rotate(-1deg)}45%{transform:translateY(-7px) rotate(1deg)}52%{transform:translateY(-7px) rotate(1deg) scaleY(.97)}58%{transform:translateY(-7px) rotate(1deg) scaleY(1)}}
    @keyframes bubble-in{from{opacity:0;transform:translateY(7px) scale(.96)}to{opacity:1;transform:none}}
    @media(max-width:680px){.study-pet{right:8px!important;top:8px!important;bottom:auto!important}.study-pet-host{padding-right:20px!important;min-height:0}.study-pet--hero{position:relative!important;right:auto!important;top:auto!important;bottom:auto!important;left:auto!important;width:max-content;max-width:100%;margin:16px -4px -8px auto}.study-pet-character{width:82px;height:82px}.study-pet-bubble{max-width:min(220px,calc(100vw - 112px));margin-top:18px;padding:9px 29px 9px 11px;font-size:12px}.study-pet-hint{top:76px}}
    @media(prefers-reduced-motion:reduce){.study-pet-character,.study-pet-bubble{animation:none}}
  `;
  document.head.appendChild(style);
  const hero = document.querySelector('.hero');
  const pet = document.createElement('aside');
  pet.className = hero ? 'study-pet study-pet--hero' : 'study-pet';
  pet.setAttribute('aria-label', '学习陪伴宠物');
  pet.innerHTML = `<div class="study-pet-bubble"><span></span><button class="study-pet-close" aria-label="暂时收起宠物提示">×</button></div><button class="study-pet-character" aria-label="让学习宠物换一句话"><img src="${petImage}" alt="紫色像素学习宠物"></button><small class="study-pet-hint">点我换一句</small>`;
  if (hero) {
    hero.classList.add('study-pet-host');
    hero.appendChild(pet);
  } else {
    document.body.appendChild(pet);
    const compact = window.matchMedia('(max-width:680px)').matches;
    Object.assign(pet.style, {
      position: 'fixed',
      right: compact ? '8px' : '18px',
      top: compact ? '8px' : '18px',
      bottom: 'auto',
      left: 'auto',
      zIndex: '9999'
    });
  }
  const bubble = pet.querySelector('.study-pet-bubble');
  const text = bubble.querySelector('span');
  let last = -1;
  const speak = () => {
    let next;
    do next = Math.floor(Math.random() * lines.length); while (next === last && lines.length > 1);
    last = next;
    text.textContent = lines[next];
    bubble.hidden = false;
    bubble.style.animation = 'none';
    void bubble.offsetWidth;
    bubble.style.animation = '';
  };
  pet.querySelector('.study-pet-character').addEventListener('click', speak);
  pet.querySelector('.study-pet-close').addEventListener('click', event => {
    event.stopPropagation();
    bubble.hidden = true;
  });
  speak();
})();
