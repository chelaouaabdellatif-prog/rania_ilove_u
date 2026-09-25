# رانيا · بكالوريا 2027

برنامج مراجعة (React + Vite + Express) لشعبة لغات أجنبية – الألمانية.

## التشغيل

```bash
npm install      # مرة واحدة
npm run build    # بعد كل تعديل في src/
npm start        # يفتح على http://localhost:3000
```

للتطوير مع إعادة التحميل التلقائي: `npm run dev`.

- أول مرة: تختار كلمة سر للمشرف وكلمة سر لرانيا.
- كلمة سر المشرف تفتح "لوحة المشرف": نشر الإعلان المتحرك، تغييره أو إيقافه، ومتابعة التقدم.
- البيانات محفوظة في `data/db.json` (احتفظ بنسخة منه).
- رانيا تفتح البرنامج من هاتفها بالعنوان الذي يظهر عند التشغيل (نفس شبكة الواي فاي).

## الملفات

- `src/data.js`: البرنامج الأسبوعي، المواد، الوحدات وخطة السنة.
- `src/components/Today.jsx`: الصفحة الرئيسية (مهام اليوم).
- `src/components/Admin.jsx`: لوحة المشرف.
- `server.js`: الخادم وكلمات السر والحفظ.

## Cloudflare Workers

`wrangler.jsonc` + `worker/index.js` : même API que `server.js`, données dans Cloudflare KV.

- Build command : `npm run build`
- Deploy command : `npx wrangler deploy`
- Première visite du site : choisir les mots de passe (admin + Rania).
