---

🎯 **PUBG Mobile Turnuva Botu**

PUBG Mobile turnuvalarını kolayca yönetmek için geliştirilmiş bir Discord botudur.
Katılımcı ekleme, rastgele kazanan seçimi ve otomatik duyuru gibi birçok özellik içerir.

---

✨ **Özellikler**

* `/turnuva` → Yeni turnuva oluştur (harita, saat, takım limiti)
* `/turnuva-list` → Aktif turnuvaları listeler
* `/turnuva-kapat` → Turnuvayı sonlandırır, kazananları açıklar
* `/turnuva-kişi-ekle` → Belirli kullanıcıyı garantili katılımcı olarak ekler
* `/komut-durum` → Komutları açar/kapatır (sadece yetkililere özel)

---

⚙️ **Kurulum**

**1. Gereksinimler:**

* Node.js (v16 veya üzeri) kurulu olmalı
  → [https://nodejs.org/](https://nodejs.org/)

**2. Projeyi indir ve kur:**

```bash
cd PUBG-Mobile-Turnuva-Botu
npm install
```

**3. `.env` dosyasını oluştur:**

```env
TOKEN=bot_tokeniniz
CLIENT_ID=bot_client_id
GUILD_ID=sunucu_id
AUTHORIZED_ROLE_ID=yetkili_rol_id
```

**4. Botu başlat:**

```bash
node bot.js
```

---

🔐 **Notlar**

* Botun düzgün çalışması için **"Mesajları Görme"** ve **"Rolleri Yönetme"** izinlerine sahip olması gerekir.
* `.env` dosyasını kimseyle paylaşmayın.
* Slash komutları görünmüyorsa botu yeniden başlatın.

---

📎 **Bağlantılar**

* Destek Sunucusu: [https://discord.gg/YAEjW6drVY](https://discord.gg/YAEjW6drVY)
* Geliştirici: **Zywexx**
* Sorular için: Discord üzerinden DM atabilirsiniz
---

📜 **Lisans**

Bu proje, GNU General Public License v3.0 (GPL-3.0) ile lisanslanmıştır.
Lisans metnine buradan ulaşabilirsiniz: [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html)

---
