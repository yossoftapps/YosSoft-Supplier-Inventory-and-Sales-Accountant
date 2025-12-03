# خطة تنفيذية ومخطط مهام (ثنائي اللغة)

> مستند ثنائي اللغة: العربية أعلاه ثم English أدناه.

## الفهرس / Table of Contents
- **أولويات عالية / High Priority**
- **أولويات متوسطة / Medium Priority**
- **أولويات منخفضة / Low Priority**
- **مهام إضافية / Additional Tasks**
- **تشغيل محلي / Local Run**
- **سجل التغييرات / Changelog**

---

## أولويات عالية (يجب تنفيذها فوراً)

### 1. تنفيذ التحقق الصارم لملفات Excel عند الاستيراد
- [x] تعريف مخطط JSON لكل جدول (purchases, Sales, Physical_Inventory, supplierbalances)
- [x] إنشاء مكتبة تحقق قابلة للتشغيل قبل المعالجة
- [x] تنفيذ التحقق من صحة المخطط مع رسائل خطأ واضحة

### 2. إكمال منطق NetPurchases وNetSales وفق المفاتيح العشرة
- [x] تنفيذ المفاتيح العشرة لكلٍ من NetPurchases وNetSales
- [x] كتابة اختبارات وحدات لكل مفتاح
- [x] تسجيل كل عملية مطابقة مع تفاصيل المصدر والهدف

### 3. إكمال منطق تصنيع Ending Inventory
- [x] تطبيق قواعد التحويل إلى قوائم E وF
- [x] حفظ أرقام السجل المتبادلة عند المطابقة
- [x] ضمان تعديل الكميات بشكل مركزي وآمن

### 4. حماية ضد توليد تقارير بدون بيانات كافية
- [x] التحقق من توافر الملفات الأربعة الأساسية واجتياز التحقق
- [x] منع إنشاء تقارير نهائية عند نقص البيانات الحرجة

---

## أولويات متوسطة (قريباً)

### 5. استخدام نوع عدد دقيق (decimal) وسياسة rounding موثقة
- [x] استبدال الأرقام العائمة بـ `decimal.js` في الحسابات المالية
- [x] توثيق سياسة التقريب وتطبيقها في جميع التقارير

### 6. إضافة نظام تتبع أصول السجلات
- [x] تسجيل مصدر كل سجل ومعرّفات السجلات القديمة/الجديدة
- [x] إنشاء سجل تدقيق قابل للاستقصاء

### 7. بناء مجموعة اختبارات وحدات وتكامل شاملة
- [x] اختبارات تغطي حالات اليتيم والسالب وصلاحية الحقول
- [x] اختبارات أداء مع ملفات Excel ذات أحجام كبيرة

### 8. تحسين الأداء على ملفات كبيرة
- [x] استخدام chunking/streaming وهياكل فهرسة
- [x] تقليل التعقيد الزمني في عمليات المطابقة

---

## أولويات منخفضة (لاحقاً)

### 9. تحسين واجهة المستخدم
- [x] شريط بحث لكل جدول
- [x] مؤشر تقدم للعمليات الثقيلة
- [x] زر طباعة مع معاينة احترافية

### 10. تحسين جودة الكود والتوثيق
- [x] فصل واضح بين UI واللوجيك والبيانات
- [x] توثيق بالعربية/الالإنجليزية حسب الحاجة

---

## مهام إضافية

### 11. مهام إضافية
- [x] إصلاح مشكلة التقارير الفارغة بسبب عدم تطابق أسماء الحقول
- [x] تحسين فهرسة الأعمدة في تقارير NetPurchases
- [x] إنشاء اختبارات آلية للوظائف المحدثة

---

## متطلبات التهيئة والتنسيق

### 12. تنسيق البيانات ودقة الأرقام
- [x] تنسيق الكميات بعشريتين (00.00)
- [x] تنسيق المبالغ مع فاصل الآلاف
- [x] تنسيق التواريخ `yyyy-mm-dd`

### 13. تقارير إضافية
- [x] تقرير فائض المخزون
- [x] تقرير تكلفة المبيعات
- [x] تقرير استحقاقات الموردين

### 14. متطلبات الأداء والجودة
- [x] أهداف زمنية ومقاييس أداء لمعالجة 50k/200k سجل

### 15. الطباعة والتصدير
- [x] تصدير Excel متعدد الأوراق
- [ ] إضافة علامة مائية على الملفات المصدرة

---

## تشغيل محلي / Local Run

Arabic (تشغيل محلي):

- مطلوب Node.js (موصى به: 18+). 
- تثبيت الاعتمادات:

```powershell
cd "e:\YosSoft\YosSoftGit\YosSoft Supplier, Inventory and Sales Accountant"
npm install
```

- أوامر مفيدة:

```powershell
npm run dev        # تشغيل واجهة Vite للتطوير
npm run build      # بناء حزمة الإنتاج
npm run electron   # تشغيل Electron (إذا ثبتت حزمة electron)
npm run electron-dev  # تشغيل Vite + Electron معاً
```

English (Local Run):

- Node.js required (recommended v18+).
- Install dependencies:

```powershell
cd "e:\YosSoft\YosSoftGit\YosSoft Supplier, Inventory and Sales Accountant"
npm install
```

- Useful scripts:

```powershell
npm run dev
npm run build
npm run electron
npm run electron-dev
```

---

## سجل التغييرات / Changelog

- الفرع المقترح: `docs/update-todo`
- رسالة الالتزام المقترحة: `docs: update TODO.md — bilingual structured plan and local run instructions`
- ملاحظة: تم استبدال محتوى `TODO.md` بمستند ثنائي اللغة كما طُلب (بدون نسخة احتياطية داخل المستودع).

---

## English Version (summary)

This file contains the project's execution plan in Arabic followed by English instructions for local setup and run. Major sections:

- High / Medium / Low priorities
- Additional tasks and format requirements
- Local run instructions and recommended Node/npm commands
- Changelog and branch/commit suggestions

If you want the tasks converted into a machine-readable tracker (CSV/JSON) or a GitHub Projects board, tell me and I will prepare that next.

---

## قضايا تشغيلية مهمة (عدم ظهور البيانات في التقارير)

الوصف:
- توجد حالة حيث عملية الاستيراد تعمل بنجاح (الملف التجريبي مُرفق بالمشروع) لكن البيانات لا تظهر في التقارير النهائية.

أهداف التشخيص السريع:
- التأكّد من أن عملية الاستيراد تكتب السجلات إلى المكان المتوقع (قاعدة بيانات محلية أو الذاكرة المؤقتة).
- التحقّق من تطابق أسماء الأعمدة بين ملف Excel ومخطط التحقق (case, whitespace, language differences).
- التحقق من أن عمليات الفلترة أو المفاتيح المطابقة لا تستبعد السجلات عن طريق الخطأ.

خطوات الإصلاح المقترحة (مهام):
- التحقق من الملف العيّنة المرفق: تشغيل سكربت استيراد مخصص على `tests/` أو `scripts/` يقرأ الملف ويخرج عدد السجلات ومخطط الحقول.
- إضافة لوج تفصيلي أثناء الاستيراد: سجل (log) الأسماء المستخرجة للأعمدة، عدد الصفوف بعد كل مرحلة (قراءة، تنظيف، تحقق، إدخال).
- إنشاء اختبار تكامل صغير يحمّل ملف العينة ويقارن عدد السجلات المتوقعة بالناتج في الذاكرة أو قاعدة البيانات المؤقتة.
- التحقق من عمل المدقق `schemaValidator` على ملف العينة وإخراج أي أخطاء صامتة (اجعل الأخطاء تُرفع كاستثناء في وضع الاختبار).
- إذا كانت عمليات المطابقة (matching) تعتمد على مفاتيح قابلة للتغيير، أضف خاصية `debug=true` لتشغيل مخرجات مفصّلة عن سبب استبعاد كل سجل.
- أضف شاشة/مربع حوار في `ImportDataPage.jsx` لعرض نتائج التحقق بعد الاستيراد (عدد السجلات الصالحة/المرفوضة مع أسباب الرفض).

Deliverables:
- سكربت تشغيل سريع `scripts/debug-import.js` (أو إضافة ملف اختبار في `tests/`) يقرأ `sample.xlsx` ويطبع تقرير تشخيصي.
- تحديث `ImportDataPage.jsx` لعرض ملخص التحقق بعد الاستيراد.

---

## إصلاح التحذيرات في الـ Console (Ant Design وElectron)

التحذيرات التي وردت في السجل:

```
Warning: [antd: Spin] `tip` only work in nest or fullscreen pattern.
Warning: [antd: Dropdown] `overlay` is deprecated. Please use `menu` instead.

Electron Security Warning (Insecure Content-Security-Policy) This renderer process has either no Content Security
	Policy set or a policy with "unsafe-eval" enabled. This exposes users of
	this app to unnecessary security risks.
```

تفسير سريع ومقترحات إصلاح:

- Spin `tip` warning:
	- السبب: في إصدارات Ant Design الأخيرة، خاصية `tip` تعمل فقط عندما يكون `Spin` في وضعية التداخل (nest) أو ملء الشاشة.
	- الحل: تأكد أن `Spin` الذي يستخدم `tip` ملفوف داخل عنصر يدعم النمط أو استخدم prop `size`/`indicator` بدلاً من `tip`، أو حرك `tip` إلى عنصر `Spin` الأعلى مستوى بحيث يصبح "nested".
	- ملفات مرجعية: راجع المكونات في `src/components` حيث يستعمل `Spin` (ابحث عن `import { Spin } from 'antd'`).

- Dropdown `overlay` deprecated:
	- السبب: API القديمة `overlay` استبدلت بمفتاح `menu` الذي يتوقع هيكل `items` أو عنصر `Menu` جديد.
	- الحل: تحديث استدعاءات `Dropdown` لتصبح بالشكل الجديد: `<Dropdown menu={{ items }}>` أو تحويل `overlay` إلى `menu` باستخدام `items` أو `legacyMenu` adapter.
	- اقتراح تنفيذ: إيجاد كل استدعاءات `overlay` واستبدالها، ثم تشغيل واجهة dev للتأكد من اختفاء التحذيرات.

- Electron Content-Security-Policy warning:
	- السبب: لا توجد سياسة CSP في الـ renderer أو تستخدم `unsafe-eval` (مثلاً أدوات devtools أو bundler تضعها أثناء التطوير).
	- الحل قصيرة المدى (التطوير): لا تقلل من صلاحيات CSP أثناء التطوير إنما علّق التحذير مؤقتًا إن لزم. الأفضل:
		1. ضبط ترويسة CSP في `index.html` بإزالة `unsafe-eval`، مثلاً:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';">
```

		2. في عملية Electron (ملف `electron.cjs` أو ملف يبدأ التطبيق)، تأكد من `webPreferences` في `BrowserWindow` تحتوي على `contextIsolation: true`, `nodeIntegration: false`، وتستخدم `preload.cjs` لتمرير واجهات آمنة.
		3. استخدم أدوات bundler التي لا تطلب `unsafe-eval` في بيئة الإنتاج. في وضع التطوير، `vite` قد تستخدم `eval` لمصدر خرائط السورس؛ تقليل ذلك يتطلب تكوين `vite` لتوليد sourcemap أنواع مختلفة أو توجيه electron لعدم تحميل السياسات القاسية أثناء التطوير فقط.

مهام محددة للتنفيذ:
- ابحث واستبدل استخدام `Spin tip` غير الصحيح في `src/components/*` و`src/pages/*`، اختبر واجهة المستخدم بعد التعديلات.
- استبدل جميع `Dropdown` usages التي تستخدم `overlay` بالـ API الجديد (`menu` + `items`)؛ مرجع: Ant Design docs.
- أضف/حدّث `meta` Content-Security-Policy في `index.html`، وراجع إعدادات `BrowserWindow` في `electron.cjs` و`start-electron.cjs` لتعيين `contextIsolation: true` و`nodeIntegration: false`.
- أضف وثائق قصيرة في `README.md` تشرح الفرق بين وضعية التطوير والإنتاج بالنسبة لـ CSP وتحذيرات الأمان.

---

