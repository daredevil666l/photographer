const burger  = document.getElementById('burger');
const overlay = document.getElementById('overlay');

function toggleMenu(){
  document.body.classList.toggle('menu-open');
}

burger.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

document.addEventListener('keyup', e=>{
  if(e.key==='Escape' && document.body.classList.contains('menu-open')){
    toggleMenu();
  }
});

/* === Новое: выделяем пункт текущей страницы === */
function highlightCurrent(){
  const links = document.querySelectorAll('.menu a');
  const current =
        location.hash ? location.hash :              // одностраничный вариант
        location.pathname.split('/').pop() || 'index.html'; // многостраничный

  links.forEach(link=>{
    const href = link.getAttribute('href');
    if(href === current || href === '#'+current.replace('#','')){
      link.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', highlightCurrent);


/* берём все фотографии блока About */
const photos = document.querySelectorAll('.about-photos .photo');

if (photos.length) {
  /* движение учитываем по всей странице */
  window.addEventListener('mousemove', e => {
    const xNorm = (e.clientX / window.innerWidth  - 0.5) * 2;   // −1 … 1
    const yNorm = (e.clientY / window.innerHeight - 0.5) * 2;

    photos.forEach((ph, i) => {
      /* базовый радиус смещения (px) — поправьте на своё усмотрение */
      const base = 15;                    // «силу» эффекта регулируем здесь
      const k    = i === 0 ? 1.3 : 1;     // чуть разная амплитуда для кадров

      const tx = xNorm * base * k;        // горизонталь
      const ty = yNorm * base * 0.6 * k;  // вертикаль (поменьше)

      ph.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });

  /* при уходе курсора за окно возвращаем всё на место */
  window.addEventListener('mouseout', () =>
    photos.forEach(ph => ph.style.transform = '')
  );
}


const slider = new Swiper('.sale__slider', {
  loop: true,
  speed: 600,
  navigation: {
    nextEl: '.sale-nav.next',
    prevEl: '.sale-nav.prev'
  },
  slidesPerView: 1,
  effect: 'slide',
  grabCursor: true
});


