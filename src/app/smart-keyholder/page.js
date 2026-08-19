import SmartKeyholderClient from './SmartKeyholderClient';

export const metadata = {
  title: 'Розумна Світлодіодна Ключниця з Датчиком Руху | BUBA LAB',
  description: 'Автоматичне контурне підсвічування коридору, акумулятор Samsung 3000 мА·год, Type-C, авторський 3D-дизайн та пожежна безпека. Замовляйте в Telegram!',
  openGraph: {
    title: 'Розумна Світлодіодна Ключниця з Датчиком Руху',
    description: 'Більше жодної темряви у коридорі. Автономність до 7-14 днів, датчик руху, живлення Type-C.',
    images: ['/images/smart-keyholder/deer-sunset-lamp.jpg'],
  },
};

export default function SmartKeyholderPage() {
  return <SmartKeyholderClient />;
}
