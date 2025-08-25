// Takvim yardımcı fonksiyonları
export const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};
export const getFirstDayOfMonth = (date: Date): number => {
return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};
export const monthNames: string[] = [
"Ocak",
"Şubat",
"Mart",
"Nisan",
"Mayıs",
"Haziran",
"Temmuz",
"Ağustos",
"Eylül",
"Ekim",
"Kasım",
"Aralık",
];
export const dayNames: string[] = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];