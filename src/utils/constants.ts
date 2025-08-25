import { 
  Wifi, Tv, Wind, Car, Coffee, Bath, Bed, Heart, Shield,
  Thermometer, Droplets, Package, Refrigerator, Zap, Flame, 
  ChefHat, Utensils, Droplet, Loader, Shirt, ArrowUpDown,
  AlertCircle, Home, Trees, Lock, LucideIcon
} from "lucide-react";
export const amenityIcons: Record<string, LucideIcon> = {
// Temel
WiFi: Wifi,
TV: Tv,
Klima: Wind,
Isıtma: Thermometer,
'Sıcak su': Droplets,
Havlular: Package,
'Yatak çarşafları': Bed,
// Mutfak
Mutfak: Coffee,
Buzdolabı: Refrigerator,
Mikrodalga: Zap,
Ocak: Flame,
Fırın: ChefHat,
'Bulaşık makinesi': Utensils,
'Kahve makinesi': Coffee,
'Su ısıtıcısı': Coffee,
'Tost makinesi': Coffee,
// Banyo
Duş: Droplets,
Küvet: Bath,
'Saç kurutma makinesi': Wind,
Şampuan: Droplet,
Sabun: Droplets,
// Konfor
'Çamaşır makinesi': Loader,
Ütü: Shirt,
Asansör: ArrowUpDown,
Balkon: Home,
Teras: Trees,
Bahçe: Trees,
// Güvenlik
'Duman dedektörü': AlertCircle,
'Yangın söndürücü': Shield,
'İlk yardım çantası': Heart,
Kasa: Lock,
// Otopark
'Ücretsiz otopark': Car,
'Kapalı otopark': Car,
Vale: Car,
Otopark: Car
};
interface SiteImages {
heroMain: string;
heroApartments: string;
heroTours: string;
heroRentals?: string[];
}
export const defaultSiteImages: SiteImages = {
heroMain: "https://taksim360.com.tr/wp-content/uploads/2024/01/otel3.jpg",
heroApartments: "https://www.tokihaber.com.tr/wp-content/uploads/2020/06/taksim-360-projesi.jpg",
heroTours: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&h=900&fit=crop"
};