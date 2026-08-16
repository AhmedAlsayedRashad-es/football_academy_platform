# Translation Guide - Future Stars FC Academy Platform

## Overview

The Future Stars FC Academy Platform supports **bilingual operation** with English and Arabic languages. This document provides guidelines for developers and translators working with the translation system.

---

## Translation System Architecture

### **File Location**
All translations are centralized in:
```
client/src/contexts/LanguageContext.tsx
```

### **Structure**
```typescript
const translations: Record<Language, Record<string, string>> = {
  en: {
    "key.name": "English Text",
    // ...
  },
  ar: {
    "key.name": "النص العربي",
    // ...
  },
};
```

---

## Translation Key Naming Conventions

### **Format**
```
section.subsection.element
```

### **Examples**
- `training.title` - Page title
- `training.type.technical` - Specific option value
- `training.sessionCreated` - Toast/notification message
- `menu.videoAnalysis` - Navigation menu item

### **Guidelines**
1. **Use camelCase** for multi-word elements (e.g., `sessionCreated`, not `session_created`)
2. **Be specific** - Include context in the key name
3. **Group related keys** - Use consistent prefixes for related features
4. **Avoid abbreviations** - Use full words for clarity

---

## Translation Categories

### **1. Navigation & Menu** (`nav.*`, `menu.*`)
Interface navigation elements, sidebar menu items, and breadcrumbs.

**Example:**
```javascript
"nav.dashboard": "Go to Dashboard",
"menu.videoAnalysis": "Video Analysis",
```

### **2. Page Titles & Subtitles** (`*.title`, `*.subtitle`)
Main headings and descriptive text for each page.

**Example:**
```javascript
"training.title": "Training Sessions",
"training.subtitle": "Manage and schedule training sessions for your teams",
```

### **3. Form Labels** (`*.label`, field names)
Input field labels, dropdown options, and form elements.

**Example:**
```javascript
"training.sessionTitle": "Session Title",
"training.selectTeam": "Select team",
```

### **4. Actions & Buttons** (action verbs)
Button text, links, and interactive elements.

**Example:**
```javascript
"training.scheduleSession": "Schedule Session",
"training.takeAttendance": "Take Attendance",
```

### **5. Status & States** (`*.status.*`)
Item states, progress indicators, and status labels.

**Example:**
```javascript
"training.status.scheduled": "Scheduled",
"training.status.completed": "Completed",
```

### **6. Messages & Notifications** (success/error messages)
Toast notifications, alerts, and user feedback.

**Example:**
```javascript
"training.sessionCreated": "Training session created successfully",
"training.sessionFailed": "Failed to create session",
```

### **7. Data Types & Options** (`*.type.*`, `*.intensity.*`)
Dropdown options, radio button values, and categorical data.

**Example:**
```javascript
"training.type.technical": "Technical",
"training.intensity.high": "High",
```

---

## Arabic Translation Guidelines

### **1. Right-to-Left (RTL) Support**
The platform automatically handles RTL layout when Arabic is selected via the `isRTL` flag in the language context.

### **2. Grammar & Terminology**
- Use **Modern Standard Arabic (MSA)** for formal content
- Use **Egyptian dialect** sparingly for colloquial terms when appropriate
- Maintain **consistency** in football terminology

### **3. Football-Specific Terms**

| English | Arabic | Notes |
|---------|--------|-------|
| Training | تدريب | General training |
| Session | جلسة | Training session |
| Match | مباراة | Football match |
| Drill | تمرين | Training drill/exercise |
| Technical | فني | Technical skills |
| Tactical | تكتيكي | Tactical play |
| Physical | بدني | Physical conditioning |
| Mental | ذهني | Mental coaching |
| Formation | تشكيلة | Team formation |
| Lineup | التشكيلة | Match lineup |
| Substitution | تبديل | Player substitution |
| Goal | هدف | Goal scored |
| Assist | تمريرة حاسمة | Goal assist |
| Pass | تمريرة | Pass |
| Shot | تسديدة | Shot on goal |
| Tackle | مراوغة | Tackle |
| Dribble | مراوغة | Dribbling |
| Sprint | عدو سريع | Sprint |
| Recovery | استشفاء | Recovery/rest |
| Intensity | شدة | Training intensity |
| Workload | حمل التدريب | Training load |

### **4. Common Phrases**

| English | Arabic |
|---------|--------|
| View Details | عرض التفاصيل |
| Edit | تعديل |
| Delete | حذف |
| Save | حفظ |
| Cancel | إلغاء |
| Confirm | تأكيد |
| Success | نجاح |
| Failed | فشل |
| Loading... | جاري التحميل... |
| No data available | لا توجد بيانات متاحة |
| Are you sure? | هل أنت متأكد؟ |
| Created successfully | تم الإنشاء بنجاح |
| Updated successfully | تم التحديث بنجاح |

---

## Using Translations in Code

### **1. Import the Hook**
```typescript
import { useLanguage } from "@/contexts/LanguageContext";
```

### **2. Access Translation Function**
```typescript
const { t, language, isRTL } = useLanguage();
```

### **3. Translate Text**
```typescript
<h1>{t("training.title")}</h1>
<p>{t("training.subtitle")}</p>
```

### **4. Handle RTL Layout**
```typescript
<div dir={isRTL ? "rtl" : "ltr"}>
  {/* Content automatically adjusts */}
</div>
```

### **5. Dynamic Text**
For text that includes variables, use template strings:
```typescript
const message = `${t("training.sessionCreated")}: ${sessionName}`;
```

---

## Adding New Translations

### **Step 1: Identify the Text**
Locate hardcoded English text in your component.

### **Step 2: Create Translation Keys**
Add both English and Arabic translations to `LanguageContext.tsx`:

```typescript
// English section
"feature.newKey": "New Feature Text",

// Arabic section
"feature.newKey": "نص الميزة الجديدة",
```

### **Step 3: Replace Hardcoded Text**
```typescript
// Before
<Button>Schedule Session</Button>

// After
<Button>{t("training.scheduleSession")}</Button>
```

### **Step 4: Test Both Languages**
1. Switch to English - verify text displays correctly
2. Switch to Arabic - verify translation and RTL layout
3. Check for text overflow or layout issues

---

## Translation Coverage Status

### ✅ **Fully Translated Pages**
- Landing Page (Home)
- Navigation & Menu
- Features Section
- Gallery
- Team Section
- Reviews
- FAQ
- Pricing
- Contact
- Events
- Tactical Hub
- Attack Sequence
- 3D Match Review
- Coach Certification
- **Training Sessions** ✨ (newly added)
- **Performance Tracking** ✨ (newly added)
- **Physical Training** ✨ (newly added)
- **Mental Coaching** ✨ (newly added)
- **Nutrition Planning** ✨ (newly added)
- **Match Management** ✨ (newly added)
- **Video Analysis** ✨ (newly added)
- **Analytics Dashboard** ✨ (newly added)
- **GPS Tracking** ✨ (newly added)

### ⚠️ **Partially Translated Pages**
- Player Dashboard (some hardcoded text remains)
- Settings Page (admin sections need translation)
- User Management (table headers need translation)

### ❌ **Not Yet Translated**
- Individual Development Plans (IDP) page
- Rewards & Achievements page
- Parent Portal specific sections
- Admin-only pages (Role Management, Cache Management)
- Error messages in backend validation

---

## Best Practices

### **1. Consistency**
- Use the same translation for the same concept across the platform
- Example: Always use "جلسة" for "Session", not alternating with "دورة"

### **2. Context Matters**
- "Match" as a noun (مباراة) vs "Match" as a verb (مطابقة)
- Provide context in key names: `match.noun` vs `match.verb`

### **3. Avoid Over-Translation**
- Keep brand names in English: "Future Stars FC"
- Keep technical terms if commonly used in English: "GPS", "xG"

### **4. Test Edge Cases**
- Long Arabic text in buttons (may cause overflow)
- Numbers and dates (formatting differs in Arabic)
- Mixed English/Arabic content (player names, etc.)

### **5. Accessibility**
- Ensure screen readers work with both languages
- Maintain semantic HTML structure
- Don't rely solely on visual indicators

---

## Common Issues & Solutions

### **Issue 1: Missing Translation Key**
**Symptom:** Key name displays instead of translated text  
**Solution:** Add the key to both `en` and `ar` sections of `LanguageContext.tsx`

### **Issue 2: Text Overflow in Arabic**
**Symptom:** Arabic text is longer and breaks layout  
**Solution:** Use `truncate` or `line-clamp` utilities, or adjust container width

### **Issue 3: RTL Layout Breaks**
**Symptom:** Icons or elements misaligned in Arabic  
**Solution:** Use logical properties (`start`/`end` instead of `left`/`right`)

### **Issue 4: Numbers Display Incorrectly**
**Symptom:** Arabic numerals (١٢٣) instead of Western (123)  
**Solution:** Explicitly format numbers or use `lang="en"` for numeric content

---

## Translation Workflow

### **For Developers**
1. Write feature in English first
2. Extract all user-facing text
3. Create translation keys following naming conventions
4. Add English translations
5. Request Arabic translations from translator
6. Implement translations in components
7. Test both languages thoroughly

### **For Translators**
1. Receive list of English keys and context
2. Provide accurate Arabic translations
3. Note any cultural adaptations needed
4. Review translations in context (screenshots)
5. Provide feedback on layout issues

---

## Future Enhancements

### **Planned Features**
- [ ] Add French language support
- [ ] Implement translation management UI for admins
- [ ] Add translation completion percentage tracker
- [ ] Create automated translation testing
- [ ] Add language-specific date/time formatting
- [ ] Implement pluralization rules
- [ ] Add gender-specific translations where needed

---

## Contact

For translation questions or to report issues:
- **Developer:** Check `LanguageContext.tsx` for existing patterns
- **Translator:** Refer to football terminology section above
- **Admin:** Use consistent keys when adding new features

---

**Last Updated:** January 3, 2026  
**Translation Coverage:** ~85% complete  
**Supported Languages:** English (en), Arabic (ar)
