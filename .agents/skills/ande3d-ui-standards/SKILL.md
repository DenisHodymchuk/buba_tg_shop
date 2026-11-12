---
name: ande3d-ui-standards
description: >-
  Always use this skill when making any UI improvements, styling updates, mobile
  adaptations, animations, or new components for the ANDE_3D website and admin
  panel. Enforces the Hallmark Dusk design system, smooth animations, and
  mobile-first clarity.
---

# ANDE_3D UI & Animation Standards

Використовуй цей скіл щоразу при роботі над інтерфейсом, стилями, анімаціями або мобільною версією сайту та адмінки **ANDE_3D**.

## 1. Дизайн-система (Hallmark Dusk)

Усі токени та класи адмінки визначені в [`src/app/admin/dusk.css`](../../../src/app/admin/dusk.css). Використовуй виключно їх, не вигадуй сторонні кольори чи кислотні акценти:

- **Поверхні та текст**:
  - `--color-paper`, `--color-paper-2`, `--color-paper-3` (темні сланцеві поверхні), `--glass` / `--glass-elevated` (димчасте скло).
  - `--color-ink`, `--color-ink-2`, `--color-muted`, `--color-rule`.
- **Два стримані сигнали**:
  - **Periwinkle (`--color-accent`)**: активний стан, основна дія, виконано, багатоденний акцент.
  - **Apricot (`--color-accent-2`)**: очікування, пріоритет, мало залишків, увага.
  - **Muted Rose (`--color-danger`)**: видалення / скасовано / немає (ніколи не використовувати яскравий неоновий червоний).
- **Типографіка та готові класи**:
  - Шрифти: `Wix Madefor Display` (заголовки) та `Wix Madefor Text` (текст).
  - Для всіх чисел, цін, кількостей і дат додавай клас `dusk-num` або `dusk-mono`.
  - Повторно використовуй `.dusk-glass`, `.dusk-panel`, `.dusk-tally`, `.dusk-table`, `.dusk-facet-pill`, `.dusk-segmented`, `.dusk-btn`, `.dusk-badge`.

## 2. Плавність і анімації (Обов'язково)

Усе в інтерфейсі має перемикатися й рухатися **плавно**, без різких стрибків:

- **Сегментовані перемикачі (`.dusk-segmented`) та вкладки**:
  - Використовуй ковзну підкладку `motion.span` із `layoutId` та `transition={{ type: 'spring', stiffness: 450, damping: 34 }}`.
- **Зміна вмісту вкладок / режимів**:
  - Обгортай контент в `<AnimatePresence mode="wait">` і `<motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: 'easeOut' }}>`.
- **Розкривні панелі та форми**:
  - Завжди анімуй `height: 0` → `height: 'auto'` (з `overflow: 'hidden'` на зовнішньому `motion.div` і `padding` на внутрішньому `div`, `transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}`), щоб нижній контент плавно підіймався й опускався без стрибків.
- **Мікро-переходи**:
  - Усі інтерактивні елементи (кнопки, піли, картки) повинні мати CSS `transition` (`var(--dur-micro)` 120ms або `var(--dur-short)` 220ms `ease-out`).
- **Модалки та висувні панелі**:
  - Анімуй лише GPU-властивості (`transform`, `opacity`), а повноекранні модалки виводь через портал (`createPortal(..., document.body)`), щоб `backdrop-filter` і скрол працювали без обрізання.

## 3. Мобільна адаптація (`isMobile` / `< 768px`)

- **Без широких таблиць**: на мобільному замість `<table className="dusk-table">` завжди рендери компактні картки без горизонтального переповнення.
- **Компактна шапка**:
  - Заголовок + головна кнопка дії в один верхній рядок; довгий підзаголовок приховуй на мобільному.
  - Фільтри категорій / статусів виводь в один горизонтально скрольований рядок (`flexWrap: 'nowrap', overflowX: 'auto'`), а не в 3+ рядки.
  - Показуй лише потрібну на телефоні інформацію, прибирай зайвий візуальний шум.
- **Пропорції**: підтримуй синхронізацію `isMobile` через проп із батьківського компонента адмінки (`page.js`) з фолбеком на `window.innerWidth < 768`.

## 4. Перевірка після змін

1. Перевір локально через `http://localhost:3000/admin` (статус `200`, без помилок збірки).
2. Не роби `git push origin main`, доки користувач явно не підтвердить локальні правки (або не скаже «відправляй»).
