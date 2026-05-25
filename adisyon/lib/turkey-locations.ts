export const TR_CITIES = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin",
  "Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa",
  "Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ",
  "Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay",
  "Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars",
  "Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya",
  "Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde",
  "Ordu","Osmaniye","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Şanlıurfa",
  "Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak",
];

export const TR_DISTRICTS: Record<string, string[]> = {
  "İstanbul": ["Adalar","Arnavutköy","Ataşehir","Avcılar","Bağcılar","Bahçelievler","Bakırköy","Başakşehir","Bayrampaşa","Beşiktaş","Beykoz","Beylikdüzü","Beyoğlu","Büyükçekmece","Çatalca","Çekmeköy","Esenler","Esenyurt","Eyüpsultan","Fatih","Gaziosmanpaşa","Güngören","Kadıköy","Kağıthane","Kartal","Küçükçekmece","Maltepe","Pendik","Sancaktepe","Sarıyer","Şile","Şişli","Silivri","Sultanbeyli","Sultangazi","Tuzla","Ümraniye","Üsküdar","Zeytinburnu"],
  "Ankara": ["Altındağ","Çankaya","Etimesgut","Gölbaşı","Keçiören","Mamak","Pursaklar","Sincan","Yenimahalle"],
  "İzmir": ["Balçova","Bayraklı","Bornova","Buca","Çeşme","Çiğli","Gaziemir","Güzelbahçe","Karabağlar","Karşıyaka","Konak","Narlıdere","Urla"],
  "Antalya": ["Alanya","Döşemealtı","Kaş","Kemer","Kepez","Konyaaltı","Kumluca","Manavgat","Muratpaşa","Serik"],
  "Bursa": ["Gemlik","İnegöl","Mudanya","Nilüfer","Osmangazi","Yıldırım"],
  "Adana": ["Çukurova","Seyhan","Yüreğir"],
  "Gaziantep": ["Nizip","Şahinbey","Şehitkamil"],
  "Konya": ["Karatay","Meram","Selçuklu"],
  "Mersin": ["Akdeniz","Erdemli","Mezitli","Tarsus","Toroslar","Yenişehir"],
  "Muğla": ["Bodrum","Datça","Fethiye","Marmaris","Menteşe","Milas"],
  "Kocaeli": ["Gebze","İzmit","Körfez"],
  "Sakarya": ["Adapazarı","Erenler","Serdivan"],
  "Denizli": ["Merkezefendi","Pamukkale"],
  "Diyarbakır": ["Bağlar","Kayapınar","Sur","Yenişehir"],
  "Trabzon": ["Akçaabat","Ortahisar"],
  "Malatya": ["Battalgazi","Yeşilyurt"],
  "Samsun": ["Atakum","Canik","İlkadım"],
  "Eskişehir": ["Odunpazarı","Tepebaşı"],
  "Hatay": ["Antakya","İskenderun"],
  "Tekirdağ": ["Çerkezköy","Çorlu","Ergene","Süleymanpaşa"],
  "Balıkesir": ["Altıeylül","Bandırma","Karesi"],
  "Aydın": ["Didim","Efeler","Kuşadası","Nazilli"],
  "Manisa": ["Akhisar","Salihli","Şehzadeler","Yunusemre"],
  "Kayseri": ["Kocasinan","Melikgazi","Talas"],
  "Kahramanmaraş": ["Dulkadiroğlu","Onikişubat"],
};

export async function reverseGeocodeCity(lat: number, lng: number): Promise<{ city: string; district: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=tr`,
      { headers: { "User-Agent": "adisyon-app/1.0" } }
    );
    const data = await res.json() as { address?: Record<string, string> };
    const a = data.address ?? {};
    const rawCity = a.province ?? a.state ?? a.city ?? a.town ?? "";
    const rawDistrict = a.county ?? a.suburb ?? a.district ?? a.quarter ?? "";
    const city = TR_CITIES.find((c) => rawCity.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(rawCity.toLowerCase())) ?? rawCity;
    const districts = city ? TR_DISTRICTS[city] ?? [] : [];
    const district = districts.find((d) => rawDistrict.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(rawDistrict.toLowerCase())) ?? "";
    return { city, district };
  } catch {
    return { city: "", district: "" };
  }
}
