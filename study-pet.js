(() => {
  if (document.querySelector('.study-pet')) return;
  const petImage = new URL('assets/study-pet-v1.png', document.currentScript.src).href;
  const lines = [
    '今天不求看得快，只求真正会一道。',
    '先抓决定性线索，再看选项挖了什么坑。',
    '我都发芽了，你这页还没翻？',
    '错题不是黑历史，是下一次的送分题。',
    '别和题干吵架，先把判断依据说出来。',
    '喝口水，回来把这张卡拿下。',
    '又想只看答案？先自己说一遍理由。',
    '记不住很正常，第二轮就是来抓漏网之鱼的。',
    '今天会的这一点，考试时就可能多拿一分。',
    '先做三题，再奖励自己摸鱼五分钟。',
    '知识点不怕多，怕的是没有放进逻辑链。',
    '这个数值别裸背：对象、条件、单位一起记。',
    '别急着翻解析，我再给你十秒钟。',
    '你负责认真，我负责在旁边长叶子。',
    '难题先拆：病人是谁、发生了什么、现在先做什么？',
    '学累了可以歇，回来时从最小的一步开始。'
  ];
  const style = document.createElement('style');
  style.textContent = `
    .study-pet{position:fixed;right:18px;top:18px;z-index:60;display:flex;align-items:flex-start;gap:6px;filter:drop-shadow(0 10px 14px #4c357028)}
    .study-pet-character{width:112px;height:112px;border:0;padding:0;background:transparent;cursor:pointer;transform-origin:50% 100%;animation:pet-bob 3.6s ease-in-out infinite;image-rendering:pixelated}
    .study-pet-character img{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none}
    .study-pet-bubble{position:relative;max-width:244px;margin-top:28px;padding:11px 32px 11px 13px;border:1px solid #d9cdf1;border-radius:15px 4px 15px 15px;background:#fff;color:#302742;box-shadow:0 10px 28px #60479322;font-size:14px;line-height:1.55;animation:bubble-in .28s ease-out}
    .study-pet-bubble::after{content:'';position:absolute;right:-8px;top:12px;width:15px;height:15px;background:#fff;border-right:1px solid #d9cdf1;border-bottom:1px solid #d9cdf1;transform:rotate(-45deg)}
    .study-pet-close{position:absolute;top:3px;right:5px;width:25px;height:25px;border:0;background:transparent;color:#8a7b9c;font-size:18px;cursor:pointer}
    .study-pet-hint{position:absolute;right:15px;top:105px;padding:2px 7px;border-radius:99px;background:#fff;color:#7151b7;font-size:10px;font-weight:800;opacity:0;transition:.2s;pointer-events:none}
    .study-pet:hover .study-pet-hint{opacity:1;transform:translateY(-2px)}
    @keyframes pet-bob{0%,100%{transform:translateY(0) rotate(-1deg)}45%{transform:translateY(-7px) rotate(1deg)}52%{transform:translateY(-7px) rotate(1deg) scaleY(.97)}58%{transform:translateY(-7px) rotate(1deg) scaleY(1)}}
    @keyframes bubble-in{from{opacity:0;transform:translateY(7px) scale(.96)}to{opacity:1;transform:none}}
    @media(max-width:680px){.study-pet{right:8px;top:8px}.study-pet-character{width:82px;height:82px}.study-pet-bubble{max-width:min(220px,calc(100vw - 112px));margin-top:18px;padding:9px 29px 9px 11px;font-size:12px}.study-pet-hint{top:76px}}
    @media(prefers-reduced-motion:reduce){.study-pet-character,.study-pet-bubble{animation:none}}
  `;
  document.head.appendChild(style);
  const pet = document.createElement('aside');
  pet.className = 'study-pet';
  pet.setAttribute('aria-label', '学习陪伴宠物');
  pet.innerHTML = `<div class="study-pet-bubble"><span></span><button class="study-pet-close" aria-label="暂时收起宠物提示">×</button></div><button class="study-pet-character" aria-label="让学习宠物换一句话"><img src="${petImage}" alt="紫色像素学习宠物"></button><small class="study-pet-hint">点我换一句</small>`;
  document.body.appendChild(pet);
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

