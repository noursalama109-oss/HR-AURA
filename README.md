This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 🖥️ دليل الاستخدام

### 🔐 تسجيل الدخول
ادخل بالبريد وكلمة المرور — كل دور يرى فقط ما تسمح له صلاحياته.

### 📊 لوحة التحكم
أرقام حية: الموظفين، حضور اليوم، طلبات معلقة، تنبيهات + رسم بياني لحضور الأسبوع.

### 👥 الموظفون
إضافة موظف (كود تلقائي + PIN) — وملف كامل لكل موظف بتبويبات:
البيانات، الحضور، الإجازات، العقود، السلف، المسحوبات، المرتبات، التقييمات، الأجهزة الموثوقة.

### ⏰ الحضور والانصراف
سجل يومي لكل موظف + كشك تسجيل داخلي + معالجة يومية تلقائية للغياب.

### ️ كشك الموظف بالـ QR (الميزة البيعية الأولى)
1. من **الإعدادات** → دوس **طباعة** على QR الفرع والصقه على الحائط.
2. الموظف يمسح الكود بكاميرا موبايله → تفتح صفحة الكشك.
3. يختار **حضور** أو **انصراف** + يدخل كوده و PIN.
4. **أول مرة:** يأخذ الموقع + IP ويربط الجهاز بالموظف.
5. **بعد كده:** أي جهاز آخر يُرفض تلقائياً + تنبيه أمني للموارد البشرية.
6. الأوفر تايم يتحسب لوحده بعد 8 ساعات شغل.

### 🌙 الإجازات
طلب → موافقة مدير → موارد بشرية، مع رصيد إجازات تلقائي.

### 📄 العقود والمستندات
تنبيهات انتهاء (30/15/7 يوم) تصل للإشعارات بدون تكرار.

### 💸 السلف والمسحوبات
سلف بأقساط شهرية تُخصم تلقائياً عند اعتماد المرتب + مسحوبات شهرية تُخصم من مرتب نفس الشهر.

### 💵 المرتبات
إنشاء كشف الشهر بضغطة → حساب تلقائي كامل → مراجعة → إعادة حساب عند الحاجة → اعتماد (يخصم السلف والمسحوبات) → صرف.

### 📈 التقارير
رسوم بيانية لكل شيء + تصدير CSV يفتح عربي سليم في Excel.

### ⚙️ الإعدادات
تعديل الشركة والفروع بالكامل + خريطة تفاعلية لتحديد الموقع + توليد QR جديد + نسب التأمينات والضرائب + الأدوار والصلاحيات.

---

## 🎯 ليه تشتري HR AURA؟

- ✅ **لا يحتاج أجهزة بصمة غالية** — موبايل الموظف + ورقة QR مطبوعة.
- ✅ **يمنع التلاعب** — بصمة جهاز + موقع + PIN، وصاحبك مش هيقدر يبصم لزميله الغايب.
- ✅ **المرتبات بدون أخطاء بشرية** — كل الخصومات والإضافات تلقائية.
- ✅ **عربي 100%** — واجهة RTL وتقارير Excel عربية.
- ✅ **يعمل على أي سيرفر رخيص** أو حتى جهاز المكتب.

## 🛣️ قادم قريباً
نسخة ديسكتوب (Electron) — قسيمة مرتب PDF — تطبيق موبايل.

---
© 2026 HR AURA — جميع الحقوق محفوظة
