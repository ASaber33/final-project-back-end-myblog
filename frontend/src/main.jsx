import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowUpLeft, BookOpen, Check, ChevronDown, Eye, EyeOff, Heart, LogOut, MessageCircle, PenLine, Sparkles, X, Bell, Trash,
  FileText, Trash2, Sun, Moon, RotateCcw, ShieldCheck, Users, Menu, Send, LayoutList, UserRound, UserCircle, Save, Mail,
} from 'lucide-react';
import './style.css';

const TOKEN_KEY = 'blog-token';
const USER_KEY = 'blog-user';
const THEME_KEY = 'blog-theme';
const LANGUAGE_KEY = 'blog-language';
const API_PREFIX = import.meta.env.DEV ? '/api' : '';
const ENGLISH = {
  'كل المقالات': 'All posts', 'منشوراتي': 'My posts', 'المسودات': 'Drafts', 'سلة المحذوفات': 'Trash',
  'حسابي': 'My profile', 'الرسائل': 'Messages', 'تواصل مع الأدمن': 'Contact admin',
  'رسائل المستخدمين': 'Support inbox', 'إدارة المستخدمين': 'Users', 'إدارة المحتوى': 'Content management',
  'المكان لسه فاضي شوية': 'It is a little quiet here', 'ابدأ أول حكاية وخلي أوميجا بلوج ينبض بالأفكار.': 'Publish the first story and bring Omega Blog to life.',
  'لسه مفيش منشورات ليك': 'You have no posts yet', 'اكتب حكاية جديدة وهتظهر هنا.': 'Write a story and it will show up here.',
  'مفيش مسودات': 'No drafts yet', 'احفظ أي مقال كمسودة وارجع له وقت ما تحب.': 'Save a post as a draft and come back whenever you like.',
  'السلة فاضية': 'The trash is empty', 'أي مقال تحذفه هيستقبل هنا وتحب ترجّعه.': 'Deleted posts will be here if you want to restore them.',
  'أهلًا بيك في أوميجا بلوج': 'Welcome to Omega Blog', 'مدير الموقع': 'Site admin', 'كاتب في أوميجا بلوج': 'Omega Blog writer',
  'كل المقالات': 'All posts', 'حسابي': 'My profile', 'تبديل الوضع الداكن': 'Toggle dark mode',
  'إرسال رسالة للأدمن': 'Message the admin', 'اكتب رسالتك...': 'Write your message...',
  'لا توجد رسائل بعد. ابدأ بالتواصل مع الأدمن.': 'No messages yet. Start a conversation with the admin.',
  'اختر محادثة لعرض الرسائل.': 'Choose a conversation to view messages.',
  'طلبات استعادة كلمة المرور': 'Password reset requests', 'إرسال رمز استعادة': 'Send reset code',
  'إرسال كلمة مرور مؤقتة': 'Send temporary password', 'حذف الرسالة': 'Delete message', 'حذف المحادثة': 'Delete conversation',
  'تحذف الرسالة دي؟': 'Delete this message?', 'تحذف المحادثة دي بكل رسائلها؟': 'Delete this conversation and all its messages?',
  'تم إرسال كلمة مرور مؤقتة في المحادثة.': 'A temporary password was sent in the conversation.',
  'رمز استعادة كلمة المرور:': 'Password reset code:', 'صالح لمدة 15 دقيقة.': 'Valid for 15 minutes.',
  'حساب غير معروف': 'Unknown account', 'تحديث الرسائل': 'Refresh messages',
  'جارٍ انتظار رد الأدمن...': 'Waiting for the admin to reply.',
  'بيانات التواصل': 'Contact details', 'لا توجد بيانات تواصل مسجلة للأدمن.': 'No admin contact details are available.',
  'عضو منذ': 'Member since', 'لا توجد منشورات منشورة بعد.': 'No published posts yet.',
  'العودة للمقالات': 'Back to posts', 'مراسلة الأدمن': 'Message admin',
  'اكتب': 'Write', 'تسجيل الخروج': 'Log out', 'مقال جديد': 'New post', 'بتفكر في إيه؟ اكتب حكاية جديدة...': 'What is on your mind? Write a new story...',
  'مقال': 'posts', 'الكل': 'All', 'مقالاتي': 'Mine', 'معدّل': 'edited', 'بدون عنوان': 'Untitled',
  'اقرأ المقال': 'Read post', 'إعجاب': 'Like', 'مسودة': 'Draft', 'نشر': 'Publish',
  'بنحمّل المسودات...': 'Loading drafts...', 'ثواني ونجيب آخر مسودات حسابك.': 'Fetching your latest drafts...',
  'نشر المقال': 'Publish post', 'تعديل': 'Edit', 'حذف': 'Delete', 'استعادة': 'Restore', 'حذف نهائي': 'Delete permanently',
  'أدمن': 'Admin', 'كاتب': 'Writer', 'حفظ الصورة': 'Save photo', 'حفظ التعديلات': 'Save changes',
  'عدّل بياناتك وصورتك الشخصية.': 'Update your details and profile photo.', 'تغيير الصورة الشخصية': 'Change profile photo',
  'عضو من': 'Member since', 'الاسم الظاهر': 'Display name', 'البريد الإلكتروني': 'Email address',
  'العمر': 'Age', 'رقم الهاتف': 'Phone number', 'اختياري': 'Optional',
  'بيانات حسابك اتحدثت بنجاح.': 'Your profile was updated.', 'صورتك الشخصية اتحدثت.': 'Your profile photo was updated.',
  'إدارة المحتوى': 'Content management',
  'إظهار كلمة المرور': 'Show password', 'إخفاء كلمة المرور': 'Hide password',
  'المقالات': 'Posts', 'التعليقات': 'Comments', 'أهلًا،': 'Welcome,', 'نصيحة': 'Tip',
  'عندك صلاحية أدمن لكامل المحتوى والمستخدمين.': 'You have admin access to all content and users.',
  'شارك أفكارك واقرأ اللي بيحصل في المجتمع.': 'Share ideas and see what the community is up to.',
  'أهلًا بعودتك.': 'Welcome back.', 'ابدأ التدوين.': 'Start writing.',
  'أنشئ حسابك وانشر مقالاتك للقرّاء.': 'Create an account and publish posts for readers.',
  'سجّل دخولك لقراءة المقالات ومتابعة التدوين.': 'Sign in to read and write posts.',
  'تسجيل الدخول': 'Sign in', 'إنشاء حساب': 'Create account', 'كلمة المرور': 'Password',
  '٨ أحرف على الأقل': 'At least 8 characters', 'الاسم اللي هتظهر بيه': 'Your display name', 'مثال: سلمى': 'e.g. Sam',
  'نسيت كلمة المرور؟': 'Forgot password?', 'لحظة واحدة...': 'One moment...', 'ابعت الكود': 'Send code',
  'طلبك وصل للأدمن. سيظهر رمز الاستعادة هنا بعد إرساله.': 'Your request was sent to the admin. The reset code will appear here when they send it.',
  'اكتب البريد أو رقم الهاتف المرتبط بالحساب عشان نبعت طلبك للأدمن.': 'Enter the email or phone number linked to your account so we can send a request to the admin.',
  'إرسال طلب للأدمن': 'Send request to admin', 'أنت': 'You',
  'لو نسيت كلمة المرور، ابعت بياناتك ورسالتك للأدمن، وهيتواصل معاك.': 'If you forgot your password, send your details and message to the admin, who will contact you.',
  'رسالتك': 'Your message', 'إرسال الرسالة': 'Send message', 'جارٍ الإرسال...': 'Sending...',
  'رسالتك وصلت للأدمن بنجاح.': 'Your message was sent to the admin.', 'إرسال رسالة أخرى': 'Send another message',
  'بنبعت...': 'Sending...', 'الكود المكوّن من ٦ أرقام': '6-digit code', 'كلمة المرور الجديدة': 'New password',
  'بعتنالك كود على': 'We sent a code to', 'غيّر كلمة المرور': 'Change password', 'بنحفظ...': 'Saving...',
  'كل مقال يفتح': 'Every post opens', 'بابًا لفكرة جديدة.': 'the door to a new idea.',
  'كل المقالات': 'All posts', 'اكتب اللي جواك.': 'Write what is on your mind.',
  'تعديل المقال.': 'Edit post.', 'مساحة حكايتك': 'Your writing space',
  'مش لازم يكون كامل. تقدر تحفظه مسودة وترجع له.': 'It does not need to be perfect. Save it as a draft and return later.',
  'عنوان المقال': 'Post title', 'إيه الفكرة اللي شاغلاك؟': 'What idea is on your mind?',
  'المقال': 'Post', 'ابدأ من أي حتة...': 'Start anywhere...',
  'حفظ كمسودة': 'Save as draft', 'دخول': 'Sign in', 'مكانك مستنيك.': 'Your place is waiting.',
  'وحشتنا.': 'We missed you.', 'اعمل حساب وابدأ تشارك أفكارك.': 'Create an account and start sharing your ideas.',
  'سجّل دخولك عشان تكمّل رحلتك.': 'Sign in to continue your journey.',
  'لسه جديد؟ اعمل حساب': 'New here? Create an account', 'عندك حساب؟ سجّل دخولك': 'Already have an account? Sign in',
  'حفظ أي مقال كمسودة وارجع له وقت ما تحب.': 'Save a post as a draft and come back whenever you like.',
  'لغة الواجهة': 'Language', 'English': 'English', 'العربية': 'العربية',
  'صفحتى الشخصية': 'My profile', 'صفحتي الشخصية': 'My profile', 'إعادة المحاولة': 'Try again',
  'جارٍ تحميل المقالات...': 'Loading posts...', 'لحظات ونحدّث القائمة.': 'Updating the list...',
  'اكتب مقال': 'Write a post', 'آخر تعديل': 'Last updated', 'اتحذف': 'Deleted',
  'بنحمّل بيانات حسابك...': 'Loading your profile...', 'مثال: 25': 'e.g. 25',
  'عدّل بياناتك وصورتك الشخصية.': 'Update your details and profile photo.',
  'مش قادرين نوصل للسيرفر. اتأكد إن الـAPI شغّال.': 'Cannot reach the server. Make sure the API is running.',
  'حصلت مشكلة، جرّب تاني.': 'Something went wrong. Please try again.',
  'مش قادرين نقرأ بيانات الحساب.': 'Could not read your account details.',
  'بيانات حسابك اتحدثت بنجاح.': 'Your profile was updated.',
  'صورتك الشخصية اتحدثت.': 'Your profile photo was updated.',
  'اختار ملف صورة من فضلك.': 'Please choose an image file.',
  'مش قادرين نجهز الصورة، جرّب صورة تانية.': 'Could not prepare the image. Try another one.',
  'الملف ده مش صورة صالحة.': 'This file is not a valid image.',
  'مش قادرين نقرأ الملف.': 'Could not read the file.',
  'حسابك اتعمل. سجّل دخولك عشان تبدأ.': 'Your account was created. Sign in to get started.',
  'مش قادرين نقرأ بيانات المقال.': 'Could not read the post details.',
  'المقال اتحفظ كمسودة.': 'Post saved as a draft.',
  'المقال اتنشر.': 'Post published.',
  'اتنقل لسلة المحذوفات.': 'Moved to trash.',
  'رجّعنا المقال.': 'Post restored.',
  'المقال اتحذف نهائيًا.': 'Post permanently deleted.',
  'المقال رجع مسودة.': 'Post moved back to drafts.',
  'صلاحية المستخدم اتغيّرت.': 'User role updated.',
  'الحساب اتحذف.': 'Account deleted.',
  'سجّلت خروجك.': 'You have been signed out.',
  'اكتب بريدك وهنبعتلك كود لتغيير كلمة المرور.': 'Enter your email and we will send a password reset code.',
  'طريقة استلام كود الاستعادة': 'How to receive your reset code',
  'اختار البريد أو رسالة SMS اللي تفضّل تستقبل عليها كود استعادة كلمة المرور.': 'Choose email or SMS to receive your password reset code.',
  'اكتب بريدًا إلكترونيًا صالحًا.': 'Enter a valid email address.',
  'اكتب رقم هاتف صالحًا مع مفتاح الدولة.': 'Enter a valid phone number with its country code.',
  'طريقة استلام غير صالحة.': 'Invalid delivery method.',
  'إرسال الرسائل النصية غير مُعدّ بعد.': 'SMS delivery is not configured yet.',
  'إرسال البريد الإلكتروني غير مُعدّ بعد.': 'Email delivery is not configured yet.',
  'تعذر إرسال الرسالة النصية. تحقق من إعدادات Twilio والرقم.': 'Could not send the SMS. Check the Twilio settings and phone number.',
  'البريد الإلكتروني': 'Email address',
  'رسالة SMS': 'SMS',
  'البريد الإلكتروني أو رقم الهاتف': 'Email address or phone number',
  'رقم الهاتف مع مفتاح الدولة': 'Phone number with country code',
  'كود الاستعادة اتبعت على بريدك.': 'The reset code was sent to your email.',
  'كود الاستعادة اتبعت في رسالة SMS.': 'The reset code was sent by SMS.',
  'لو البريد أو الرقم مسجل، هيوصلك كود الاستعادة.': 'If the email or phone is registered, you will receive a reset code.',
  'الكود اتحفظ في لوج السيرفر (SMTP مش متظبط).': 'The code was logged on the server (SMTP is not configured).',
  'بعتنالك كود على': 'We sent a code to',
  'تم إرسال طلبك للأدمن. احتفظ بهذه الصفحة لمتابعة الرد.': 'Your request was sent to the admin. Keep this page open to see the reply.',
  '٨ أحرف على الأقل': 'At least 8 characters',
  'بالمتابعة، أنت بتوافق على استخدام أوميجا بلوج باحترام ولطف.': 'By continuing, you agree to use Omega Blog respectfully and kindly.',
  'عندك سؤال؟': 'Questions?', 'كلّمنا': 'Contact us', 'مدوّنة للقرّاء والكتّاب': 'A blog for readers and writers',
  'رجوع لتسجيل الدخول': 'Back to sign in', 'مبعتليش كود؟ جرّب تاني': 'Did not get a code? Try again',
  'نسيت كلمة المرور؟': 'Forgot password?', 'سلة المحذوفات': 'Trash',
  'مستخدم': 'users', 'المستخدم': 'User', 'الصلاحية': 'Role', 'إجراءات': 'Actions',
  'تنزيل لكاتب': 'Demote to writer', 'ترقية لأدمن': 'Promote to admin', ' (أنت)': ' (you)',
  'راجع المنشورات والتعليقات، واتخذ إجراءً على كل عنصر.': 'Review posts and comments, and take action on each item.',
  'نوع المحتوى': 'Content type', 'المنشورات': 'Posts', 'تحديث': 'Refresh',
  'تصفية المنشورات': 'Filter posts', 'منشور': 'Published', 'في سلة المحذوفات': 'In trash',
  'بواسطة': 'By', 'نقل لسلة المحذوفات': 'Move to trash', 'حذف التعليق': 'Delete comment',
  'تحويل لمسودة': 'Move to draft', 'جارٍ تحميل المحتوى...': 'Loading content...',
  'لا توجد منشورات في هذا القسم.': 'There are no posts in this section.',
  'لا توجد تعليقات.': 'There are no comments.', 'منشور محذوف': 'Deleted post',
  'ابحث بالعنوان أو النص أو الكاتب...': 'Search title, text, or author...',
  'ابحث بالتعليق أو المنشور أو الكاتب...': 'Search comment, post, or author...',
  'ملخص البيانات': 'Data overview', 'إجمالي المنشورات': 'Total posts',
  'عدد المستخدمين': 'Users', 'التفاعلات': 'Reactions',
  'حجم قاعدة البيانات': 'Database size', 'آخر نشاط مسجل': 'Latest activity',
  'بايت': 'bytes', 'على جميع المنشورات': 'Across all posts',
  'حساب مسجل': 'Registered accounts', 'إعجاب وتفاعل': 'Likes and reactions',
  'يشمل الجداول والفهارس': 'Includes tables and indexes',
  'آخر تحديث للمحتوى أو التفاعل': 'Latest content or reaction update',
  'تحذف التعليق ده؟': 'Delete this comment?', 'التعليق اتحذف.': 'Comment deleted.',
  'أوميجا بلوج': 'Omega Blog',
  'أدوات الأدمن': 'Admin tools', 'استخدم «حفظ كمسودة» لو الكتابة محتاجة وقت، وانشرها لما تكون جاهزة.': 'Use “Save as draft” if you need more time, then publish when ready.',
  'إعادة المحاولة': 'Try again', 'حذف المستخدم': 'Delete user', 'العضوية': 'Membership',
  'إضافة تعليق': 'Add a comment', 'اكتب تعليقك...': 'Write a comment...', 'إرسال': 'Send',
  'تعليق': 'Comment', 'لا توجد تعليقات بعد.': 'No comments yet.',
  'اكتبه وحط كلمة المرور الجديدة.': 'Enter it and choose a new password.',
  'لما تكون جاهز انشر المقال.': 'Publish the post when you are ready.',
  'كل مقال يحكي حكاية.': 'Every post tells a story.',
  'مش قادرين نقرأ بيانات المقال.': 'Could not read the post details.',
  'اتنقل لسلة المحذوفات.': 'Moved to trash.',
  'تنقل كل المقالات المنشورة لسلة المحذوفات؟': 'Move all published posts to the trash?',
  'تحذف كل التعليقات نهائيًا؟': 'Permanently delete all comments?',
  'الحذف النهائي مفيش رجوع فيه. نكمّل؟': 'This cannot be undone. Continue?',
  'حصلت مشكلة، جرّب تاني.': 'Something went wrong. Please try again.',
  'البريد الإلكتروني': 'Email address', 'كلمة المرور': 'Password',
  'مبعتليش كود؟ جرّب تاني': 'Did not get a code? Try again',
  'تبديل الوضع الداكن': 'Toggle dark mode', 'تسجيل الخروج': 'Log out',
  'كل المقالات': 'All posts', 'مقال جديد': 'New post',
  'اكتبه وحط كلمة المرور الجديدة.': 'Enter it and choose a new password.',
  'إرسال': 'Send', 'التعليقات': 'Comments', 'اكتب تعليقك...': 'Write a comment...',
  'سجّل دخولك عشان تسيب تعليق': 'Sign in to leave a comment',
  'لسه مفيش تعليقات. افتح الكلام.': 'No comments yet. Start the conversation.',
  'حذف التعليق': 'Delete comment', 'إعجاب': 'Like', 'اسمك': 'Your name',
  'الاسم اللي الناس هتشوفه': 'The name people will see',
  'اكتبه وحط كلمة المرور الجديدة.': 'Enter it and choose a new password.',
  'مقال': 'posts',
  'مدوّنة تجمع أصوات وأفكار مختلفة': 'A blog bringing different voices and ideas together',
  'كل مقال يفتح': 'Every post opens', 'بابًا لفكرة جديدة.': 'the door to a new idea.',
  'أوميجا بلوج مساحة للقراءة والكتابة. شارك مقالاتك، واكتشف وجهات نظر وتجارب من كتّاب تانيين.': 'Omega Blog is a space to read and write. Share your posts and discover new perspectives and experiences.',
  'مقال واحد ممكن يخلّينا نشوف الموضوع من زاوية جديدة.': 'One post can help us see things from a new perspective.',
  'اقرأ. اكتب. شارك.': 'Read. Write. Share.',
  'أوميجا بلوج — مساحة للكلمة': 'Omega Blog — a space for words',
  'ابدأ التدوين.': 'Start writing.', 'أهلًا بعودتك.': 'Welcome back.',
  'أنشئ حسابك وانشر مقالاتك للقرّاء.': 'Create an account and publish posts for readers.',
  'سجّل دخولك لقراءة المقالات ومتابعة التدوين.': 'Sign in to read and write posts.',
  'اكتب اللي جواك.': 'Write what is on your mind.',
  'تعديل المقال.': 'Edit post.', 'مساحة حكايتك': 'Your writing space',
  'مش لازم يكون كامل. تقدر تحفظه مسودة وترجع له.': 'It does not need to be perfect. Save it as a draft and return later.',
  'عنوان المقال': 'Post title', 'إيه الفكرة اللي شاغلاك؟': 'What idea is on your mind?',
  'المقال': 'Post', 'ابدأ من أي حتة...': 'Start anywhere...',
  'حفظ كمسودة': 'Save as draft', 'نشر المقال': 'Publish post',
  'دخول': 'Sign in', 'مكانك مستنيك.': 'Your place is waiting.',
  'وحشتنا.': 'We missed you.', 'اعمل حساب وابدأ تشارك أفكارك.': 'Create an account and start sharing your ideas.',
  'سجّل دخولك عشان تكمّل رحلتك.': 'Sign in to continue your journey.',
  'عندك حساب؟ سجّل دخولك': 'Already have an account? Sign in',
  'لسه جديد؟ اعمل حساب': 'New here? Create an account',
  'اكتب بريدك وهنبعتلك كود لتغيير كلمة المرور.': 'Enter your email and we will send a password reset code.',
  'رجوع لتسجيل الدخول': 'Back to sign in', 'مبعتليش كود؟ جرّب تاني': 'Did not get a code? Try again',
  'بعتنالك كود على': 'We sent a code to',
  'تبديل الوضع الداكن': 'Toggle dark mode', 'إغلاق': 'Close',
  'أهلًا بيك في أوميجا بلوج': 'Welcome to Omega Blog', 'حسابي': 'My profile',
  'حفظ التعديلات': 'Save changes', 'إدارة المستخدمين': 'Users',
  'إدارة المحتوى': 'Content management',
  'المسودات': 'Drafts', 'سلة المحذوفات': 'Trash',
  'اكتب مقال': 'Write a post', 'تغيير الصورة الشخصية': 'Change profile photo',
  'عدّل بياناتك وصورتك الشخصية.': 'Update your details and profile photo.',
  'العمر': 'Age', 'رقم الهاتف': 'Phone number', 'اختياري': 'Optional',
  'حفظ الصورة': 'Save photo', 'عضو من': 'Member since',
  'حصلت مشكلة، جرّب تاني.': 'Something went wrong. Please try again.',
  'مقال اتحفظ كمسودة.': 'Post saved as a draft.',
  'المقال اتحفظ كمسودة.': 'Post saved as a draft.',
  'مساحة للكلمة': 'A space for words',
  '(أنت)': '(you)',
  'لا يمكنك إزالة صلاحية الأدمن من حسابك هنا.': 'You cannot remove admin access from your own account here.',
};

const request = async (url, { token, ...options } = {}) => {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${url}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
    });
  } catch {
    throw new Error('مش قادرين نوصل للسيرفر. اتأكد إن الـAPI شغّال.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'حصلت مشكلة، جرّب تاني.');
  return data;
};
const dateLabel = (date, language = 'ar') => (date
  ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
  : '');
const dateTimeLabel = (date, language = 'ar') => (date
  ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
  : '—');
const initial = (name) => (name || 'ف').slice(0, 1);
const Avatar = ({ user: person, size = '' }) => (person?.avatar_url
  ? <img className={`author-avatar avatar-img ${size}`} src={person.avatar_url} alt={person.username || ''} loading="lazy" />
  : <span className={`author-avatar ${size}`}>{initial(person?.username)}</span>);

const SECTIONS = [
  { id: 'feed', label: 'كل المقالات', icon: LayoutList },
  { id: 'messages', label: 'الرسائل', icon: MessageCircle },
  { id: 'contact', label: 'تواصل مع الأدمن', icon: Mail },
  { id: 'drafts', label: 'المسودات', icon: FileText },
  { id: 'trash', label: 'سلة المحذوفات', icon: Trash2 },
  { id: 'profile', label: 'حسابي', icon: UserCircle },
];
const ADMIN_SECTIONS = [
  { id: 'users', label: 'إدارة المستخدمين', icon: Users },
  { id: 'admin-messages', label: 'رسائل المستخدمين', icon: Mail, badge: true },
  { id: 'admin-content', label: 'إدارة المحتوى', icon: ShieldCheck },
];
const EMPTY_COPY = {
  feed: { title: 'المكان لسه فاضي شوية', body: 'ابدأ أول حكاية وخلي أوميجا بلوج ينبض بالأفكار.' },
  mine: { title: 'لسه مفيش منشورات ليك', body: 'اكتب حكاية جديدة وهتظهر هنا.' },
  drafts: { title: 'مفيش مسودات', body: 'احفظ أي مقال كمسودة وارجع له وقت ما تحب.' },
  trash: { title: 'السلة فاضية', body: 'أي مقال تحذفه هيستقبل هنا وتحب ترجّعه.' },
};

function PasswordField({ label, name, t, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return <label>{t(label)}<span className="password-input-wrap">
    <input {...inputProps} name={name} type={visible ? 'text' : 'password'} />
    <button
      type="button"
      className="password-visibility-toggle"
      aria-label={t(visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور')}
      aria-pressed={visible}
      onClick={() => setVisible((current) => !current)}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </span></label>;
}

function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setSplashFading(true), 900);
    const hideTimer = window.setTimeout(() => setSplashVisible(false), 1200);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const [posts, setPosts] = useState([]);
  const loadSequence = useRef(0);
  const [users, setUsers] = useState([]);
  const [adminPosts, setAdminPosts] = useState([]);
  const [adminComments, setAdminComments] = useState([]);
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminContentTab, setAdminContentTab] = useState('posts');
  const [adminPostFilter, setAdminPostFilter] = useState('all');
  const [adminContentSearch, setAdminContentSearch] = useState('');
  const [loadingSection, setLoadingSection] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [modal, setModal] = useState('');
  const [authScreen, setAuthScreen] = useState('login');
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [section, setSection] = useState('feed');
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'ar');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [avatarDraft, setAvatarDraft] = useState('');
  const [conversationMessages, setConversationMessages] = useState([]);
  const [adminThreads, setAdminThreads] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [activeAdminThread, setActiveAdminThread] = useState(null);
  const [activeAdminMessages, setActiveAdminMessages] = useState([]);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicProfilePosts, setPublicProfilePosts] = useState([]);
  const [adminContact, setAdminContact] = useState(null);
  const [contactSent, setContactSent] = useState(false);
  const [scope, setScope] = useState('all');
  const isAdmin = user?.role === 'admin';
  const t = (text) => (language === 'en' ? ENGLISH[text] || text : text);
  const countText = (count, singular, plural, arabic) => language === 'en'
    ? `${count} ${count === 1 ? singular : plural}`
    : `${count} ${arabic}`;
  const postAvatar = (post) => ({
    username: post.username,
    avatar_url: post.avatar_url || (String(post.user_id) === String(user?.id) ? user?.avatar_url : null),
  });

  const loadFeed = useCallback(async (nextScope = scope) => {
    const sequence = ++loadSequence.current;
    setLoadingSection(true);
    setError('');
    try {
      const data = await request(`/posts${nextScope === 'mine' ? '?scope=mine' : ''}`, { token });
      if (sequence === loadSequence.current) setPosts(data.posts || []);
    } catch (e) { if (sequence === loadSequence.current) setError(e.message); }
    finally { if (sequence === loadSequence.current) setLoadingSection(false); }
  }, [scope, token]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    const data = await request('/users', { token });
    setUsers(data.users || []);
  }, [isAdmin, token]);

  const loadAdminContent = useCallback(async () => {
    if (!isAdmin) return;
    setError('');
    setLoadingSection(true);
    try {
      const [overviewData, postData, commentData] = await Promise.all([
        request('/admin/overview', { token }),
        request('/admin/posts', { token }),
        request('/admin/comments', { token }),
      ]);
      setAdminOverview(overviewData.overview || null);
      setAdminPosts(postData.posts || []);
      setAdminComments(commentData.comments || []);
    } catch (e) { setError(e.message); }
    finally { setLoadingSection(false); }
  }, [isAdmin, token]);

  const loadSection = useCallback(async (next = section) => {
    const sequence = ++loadSequence.current;
    setError('');
    setLoadingSection(true);
    try {
      if (next === 'feed') {
        const data = await request(`/posts${scope === 'mine' ? '?scope=mine' : ''}`, { token });
        if (sequence === loadSequence.current) setPosts(data.posts || []);
        return;
      }
      if (next === 'users') {
        if (!isAdmin) return;
        const data = await request('/users', { token });
        if (sequence === loadSequence.current) setUsers(data.users || []);
        return;
      }
      if (next === 'profile') {
        const data = await request('/profile', { token });
        if (sequence === loadSequence.current) {
          setProfileForm(data.user);
          setAvatarDraft(data.user.avatar_url || '');
        }
        return;
      }
      if (next === 'admin-content') return;
      const path = next === 'drafts' ? '/me/drafts' : '/me/trash';
      const data = await request(path, { token });
      if (sequence === loadSequence.current) setPosts(data.posts || []);
    } catch (e) { if (sequence === loadSequence.current) setError(e.message); }
    finally { if (sequence === loadSequence.current) setLoadingSection(false); }
  }, [section, scope, token, isAdmin]);

  const goTo = (next) => {
    if (next === 'mine') {
      setScope('mine');
      setSection('feed');
    } else {
      setSection(next);
      if (next === 'profile') loadSection('profile');
      if (next === 'messages') loadConversation();
      if (next === 'admin-messages') loadAdminThreads();
      if (next === 'contact') loadAdminContact();
    }
    setMenuOpen(false);
    setError('');
  };

  // ---- Support messages (user <-> admin) ----
  const loadConversation = useCallback(async () => {
    setError('');
    try {
      const data = await request('/messages', { token });
      setConversationMessages(data.messages || []);
    } catch (e) { setError(e.message); }
  }, [token]);

  const sendUserMessage = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form).get('body');
    if (!body || !String(body).trim()) return;
    setError('');
    try {
      const data = await request('/messages', { token, method: 'POST', body: JSON.stringify({ body }) });
      form.reset();
      setConversationMessages((list) => [...list, data.message]);
    } catch (e) { setError(e.message); }
  };

  const loadAdminThreads = useCallback(async () => {
    if (!isAdmin) return;
    setError('');
    try {
      const data = await request('/admin/messages', { token });
      setAdminThreads(data.threads || []);
      setUnreadMessageCount((data.threads || []).reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0));
      const target = activeAdminThread && data.threads?.find((item) => item.id === activeAdminThread.id);
      if (target) openAdminThread(target);
    } catch (e) { setError(e.message); }
  }, [isAdmin, token]);

  useEffect(() => {
    if (!isAdmin || section !== 'admin-messages') return undefined;
    const timer = window.setInterval(loadAdminThreads, 2000);
    return () => window.clearInterval(timer);
  }, [isAdmin, section, loadAdminThreads]);

  const openAdminThread = async (thread) => {
    setActiveAdminThread(thread);
    setError('');
    try {
      const data = await request(`/admin/messages/${thread.id}`, { token });
      setActiveAdminMessages(data.messages || []);
      setAdminThreads((threads) => threads.map((item) => item.id === thread.id ? { ...item, unread_count: 0 } : item));
      setUnreadMessageCount((count) => Math.max(0, count - Number(thread.unread_count || 0)));
    } catch (e) { setError(e.message); }
  };

  const sendAdminReply = async (event) => {
    event.preventDefault();
    if (!activeAdminThread) return;
    const form = event.currentTarget;
    const body = new FormData(form).get('body');
    if (!body || !String(body).trim()) return;
    setError('');
    try {
      const data = await request(`/admin/messages/${activeAdminThread.id}`, { token, method: 'POST', body: JSON.stringify({ body }) });
      form.reset();
      setActiveAdminMessages((list) => [...list, data.message]);
    } catch (e) { setError(e.message); }
  };

  const sendResetCodeToThread = async (thread) => {
    setError('');
    try {
      const data = await request(`/admin/messages/${thread.id}/reset-password`, { token, method: 'POST' });
      setActiveAdminMessages((list) => [...list, data.message]);
      notify('تم إرسال كلمة مرور مؤقتة في المحادثة.');
    } catch (e) { setError(e.message); }
  };

  const deleteAdminMessage = async (message) => {
    if (!activeAdminThread || !window.confirm(t('تحذف الرسالة دي؟'))) return;
    try {
      await request(`/admin/messages/${activeAdminThread.id}/${message.id}`, { token, method: 'DELETE' });
      setActiveAdminMessages((list) => list.filter((item) => item.id !== message.id));
      setAdminThreads((threads) => threads.map((thread) => thread.id === activeAdminThread.id
        ? { ...thread, latest_message: thread.latest_message === message.body ? '' : thread.latest_message }
        : thread));
    } catch (e) { setError(e.message); }
  };

  const loadAdminContact = useCallback(async () => {
    setError('');
    try {
      const data = await request('/contact');
      setAdminContact(data.contact || null);
    } catch (e) { setError(e.message); }
  }, []);

  const sendPublicContactMessage = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError('');
    try {
      const data = await request('/messages', {
        token: user ? token : undefined,
        method: 'POST',
        body: user
          ? JSON.stringify({ body: values.get('body') })
          : JSON.stringify({ name: values.get('name'), email: values.get('email'), body: values.get('body') }),
      });
      form.reset();
      setContactSent(true);
      notify('رسالتك وصلت للأدمن بنجاح.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  // ---- Public user page ----
  const openUserPage = async (userId) => {
    setSection('user');
    setMenuOpen(false);
    setError('');
    setPublicProfile(null);
    setPublicProfilePosts([]);
    try {
      const data = await request(`/users/${userId}/profile`);
      setPublicProfile(data.user);
      setPublicProfilePosts(data.posts || []);
    } catch (e) { setError(e.message); }
  };

  const notify = (message) => { setNotice(message); setError(''); };

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    const formElement = event.currentTarget.closest('form');
    if (!formElement) { setBusy(false); setError('مش قادرين نقرأ بيانات الحساب.'); return; }
    const form = new FormData(formElement);
    try {
      const data = await request('/profile', {
        token,
        method: 'PATCH',
        body: JSON.stringify({
          username: form.get('username'),
          email: form.get('email'),
          avatar_url: avatarDraft,
          age: form.get('age'),
          phone: form.get('phone'),
        }),
      });
      setUser(data.user);
      setProfileForm(data.user);
      setAvatarDraft(data.user.avatar_url || '');
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      notify('بيانات حسابك اتحدثت بنجاح.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const saveAvatar = async () => {
    if (!profileForm) return;
    setBusy(true); setError('');
    try {
      const data = await request('/profile', {
        token,
        method: 'PATCH',
        body: JSON.stringify({
          username: profileForm.username,
          email: profileForm.email,
          avatar_url: avatarDraft,
          age: profileForm.age ?? '',
          phone: profileForm.phone ?? '',
        }),
      });
      setUser(data.user);
      setProfileForm(data.user);
      setAvatarDraft(data.user.avatar_url || '');
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      notify('صورتك الشخصية اتحدثت.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  // The image is downscaled in the browser so a phone photo still fits the
  // 100kb JSON limit and stays a plain data URL with no file storage needed.
  const pickAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('اختار ملف صورة من فضلك.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement('canvas');
        const scale = Math.min(size / image.width, size / image.height, 1);
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) { setError('مش قادرين نجهز الصورة، جرّب صورة تانية.'); return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        // The API caps the whole JSON body at 100kb, so step quality down until the data URL fits.
        let dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        for (let quality = 0.7; dataUrl.length > 78000 && quality >= 0.4; quality -= 0.15) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        setAvatarDraft(dataUrl);
        setError('');
      };
      image.onerror = () => setError('الملف ده مش صورة صالحة.');
      image.src = reader.result;
    };
    reader.onerror = () => setError('مش قادرين نقرأ الملف.');
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!token) return;
    // loadSection closes over the section it was created for, so calling it here
    // with the new one would re-run the effect endlessly; each branch loads directly.
    if (section === 'feed') loadFeed(scope);
    else if (section === 'drafts' || section === 'trash') loadSection(section);
    else if (section === 'users') loadUsers();
    else if (section === 'admin-content') loadAdminContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, scope, token, loadAdminContent]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3200);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.body.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') { setModal(''); setMenuOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const updatePostInLists = (updated) => {
    const apply = (list) => list.map((item) => (String(item.id) === String(updated.id) ? { ...item, ...updated } : item));
    setPosts(apply);
    setActivePost((current) => (current && String(current.id) === String(updated.id) ? { ...current, ...updated } : current));
  };

  const openPost = async (post) => {
    setActivePost(post); setModal('post'); setComments([]); setError('');
    try {
      const [postData, commentData] = await Promise.all([
        request(`/posts/${post.id}`, { token }),
        request(`/posts/${post.id}/comments`),
      ]);
      setActivePost(postData.post);
      setComments(commentData.comments || []);
    } catch (e) { setError(e.message); }
  };

  const closeModal = () => { setModal(''); setEditing(null); setError(''); };

  const submitAuth = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const mode = form.get('mode');
    const payload = { email: form.get('email'), password: form.get('password') };
    if (mode === 'register') payload.username = form.get('username');
    try {
      const data = await request(mode === 'register' ? '/register' : '/login', { method: 'POST', body: JSON.stringify(payload) });
      if (mode === 'login') {
        localStorage.setItem(TOKEN_KEY, data.token); localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setToken(data.token); setUser(data.user); setForcePasswordChange(Boolean(data.user.must_change_password)); setModal('');
      } else {
        setAuthScreen('login');
        setNotice('حسابك اتعمل. سجّل دخولك عشان تبدأ.');
        setBusy(false);
        return;
      }
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const submitForcedPasswordChange = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      await request('/password/change', { token, method: 'POST', body: JSON.stringify({ currentPassword: values.get('currentPassword'), newPassword: values.get('newPassword') }) });
      const nextUser = { ...user, must_change_password: false };
      setUser(nextUser); localStorage.setItem(USER_KEY, JSON.stringify(nextUser)); setForcePasswordChange(false);
      notify('تم تغيير كلمة المرور.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const submitPost = async (event, status) => {
    event.preventDefault(); setBusy(true); setError('');
    // "Save as draft" is a type="button" inside the form, so its click event must be
    // resolved to the form itself before FormData can read the fields.
    const formElement = event.currentTarget.tagName === 'FORM' ? event.currentTarget : event.currentTarget.closest('form');
    if (!formElement) { setBusy(false); setError('مش قادرين نقرأ بيانات المقال.'); return; }
    const form = new FormData(formElement);
    const payload = { title: form.get('title'), content: form.get('content'), status };
    try {
      const result = editing
        ? await request(`/posts/${editing.id}`, { token, method: 'PUT', body: JSON.stringify(payload) })
        : await request('/posts', { token, method: 'POST', body: JSON.stringify(payload) });
      if (status === 'draft') {
        const savedPost = {
          ...result.post,
          username: user.username,
          avatar_url: user.avatar_url,
        };
        setPosts((current) => [savedPost, ...current.filter((post) => String(post.id) !== String(savedPost.id))]);
      }
      closeModal(); notify(status === 'draft' ? 'المقال اتحفظ كمسودة.' : 'المقال اتنشر.');
      setScope(status === 'draft' ? 'all' : 'mine');
      setSection(status === 'draft' ? 'drafts' : 'feed');
      if (status !== 'draft') await loadFeed('mine');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const submitComment = async (event) => {
    event.preventDefault(); if (!activePost) return;
    const formElement = event.currentTarget;
    const content = new FormData(formElement).get('content');
    setBusy(true); setError('');
    try {
      const data = await request(`/posts/${activePost.id}/comments`, { token, method: 'POST', body: JSON.stringify({ content }) });
      formElement.reset();
      setComments((list) => [...list, data.comment]);
      setActivePost((current) => (current ? { ...current, comment_count: Number(current.comment_count || 0) + 1 } : current));
      setPosts((list) => list.map((item) => (String(item.id) === String(activePost.id) ? { ...item, comment_count: Number(item.comment_count || 0) + 1 } : item)));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const removeComment = async (comment) => {
    setError('');
    try {
      await request(`/comments/${comment.id}`, { token, method: 'DELETE' });
      setComments((list) => list.filter((item) => String(item.id) !== String(comment.id)));
      setActivePost((current) => (current ? { ...current, comment_count: Math.max(0, Number(current.comment_count || 0) - 1) } : current));
      setPosts((list) => list.map((item) => (String(item.id) === String(comment.post_id) ? { ...item, comment_count: Math.max(0, Number(item.comment_count || 0) - 1) } : item)));
    } catch (e) { setError(e.message); }
  };

  const reactToPost = async (post) => {
    if (!token) { setModal('auth'); return; }
    setError('');
    try {
      const data = await request(`/posts/${post.id}/reaction`, { token, method: 'PUT', body: JSON.stringify({ type: 'like' }) });
      updatePostInLists({ id: post.id, like_count: data.likes, my_reaction: data.reaction });
    } catch (e) { setError(e.message); }
  };

  const trashPost = async (post) => {
    try { await request(`/posts/${post.id}`, { token, method: 'DELETE' }); notify('اتنقل لسلة المحذوفات.'); await loadSection(); } catch (e) { setError(e.message); }
  };
  const restorePost = async (post) => {
    try { await request(`/posts/${post.id}/restore`, { token, method: 'POST' }); notify('رجّعنا المقال.'); await loadSection(); } catch (e) { setError(e.message); }
  };
  const purgePost = async (post) => {
    if (!window.confirm('الحذف النهائي مفيش رجوع فيه. نكمّل؟')) return;
    try { await request(`/posts/${post.id}/permanent`, { token, method: 'DELETE' }); notify('المقال اتحذف نهائيًا.'); await loadSection(); } catch (e) { setError(e.message); }
  };
  const setPostStatus = async (post, status) => {
    try {
      const data = await request(`/posts/${post.id}/status`, { token, method: 'PATCH', body: JSON.stringify({ status }) });
      updatePostInLists({ ...data.post, my_reaction: post.my_reaction, like_count: post.like_count });
      notify(status === 'published' ? 'المقال اتنشر.' : 'المقال رجع مسودة.');
      await loadSection();
    } catch (e) { setError(e.message); }
  };
  const changeRole = async (target, role) => {
    try { await request(`/users/${target.id}/role`, { token, method: 'PATCH', body: JSON.stringify({ role }) }); notify('صلاحية المستخدم اتغيّرت.'); await loadUsers(); } catch (e) { setError(e.message); }
  };
  const deleteUser = async (target) => {
    if (!window.confirm(`تحذف حساب ${target.username} وكل محتواه؟`)) return;
    try { await request(`/users/${target.id}`, { token, method: 'DELETE' }); notify('الحساب اتحذف.'); await loadUsers(); } catch (e) { setError(e.message); }
  };
  const removeAdminComment = async (comment) => {
    if (!window.confirm(t('تحذف التعليق ده؟'))) return;
    try {
      await request(`/comments/${comment.id}`, { token, method: 'DELETE' });
      notify('التعليق اتحذف.');
      await loadAdminContent();
    } catch (e) { setError(e.message); }
  };
  const manageAdminPost = async (post, action) => {
    try {
      if (action === 'trash') {
        await request(`/posts/${post.id}`, { token, method: 'DELETE' });
        notify('اتنقل لسلة المحذوفات.');
      } else if (action === 'restore') {
        await request(`/posts/${post.id}/restore`, { token, method: 'POST' });
        notify('رجّعنا المقال.');
      } else if (action === 'purge') {
        if (!window.confirm(t('الحذف النهائي مفيش رجوع فيه. نكمّل؟'))) return;
        await request(`/posts/${post.id}/permanent`, { token, method: 'DELETE' });
        notify('المقال اتحذف نهائيًا.');
      } else {
        const status = action === 'publish' ? 'published' : 'draft';
        await request(`/posts/${post.id}/status`, { token, method: 'PATCH', body: JSON.stringify({ status }) });
        notify(status === 'published' ? 'المقال اتنشر.' : 'المقال رجع مسودة.');
      }
      await loadAdminContent();
    } catch (e) { setError(e.message); }
  };

  const toggleTheme = () => {
    const value = !dark;
    setDark(value);
    localStorage.setItem(THEME_KEY, value ? 'dark' : 'light');
    document.documentElement.dataset.theme = value ? 'dark' : 'light';
  };
  const toggleLanguage = () => setLanguage((current) => {
    const next = current === 'ar' ? 'en' : 'ar';
    localStorage.setItem(LANGUAGE_KEY, next);
    return next;
  });

  useEffect(() => {
    document.title = language === 'en' ? 'Omega Blog — A space for words' : 'أوميجا بلوج — مساحة للكلمة';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', language === 'en'
      ? 'Omega Blog — a space to read, write, and share ideas.'
      : 'أوميجا بلوج — مساحة عربية للقراءة والكتابة ومشاركة الأفكار.');
  }, [language]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
    setToken(null); setUser(null); setPosts([]); setSection('feed'); setScope('all'); setNotice('سجّلت خروجك.');
  };

  const canManage = (post) => Boolean(user) && (isAdmin || String(post.user_id) === String(user.id));
  const navItems = useMemo(() => (isAdmin ? [...SECTIONS, ...ADMIN_SECTIONS] : SECTIONS), [isAdmin]);
  const emptyCopy = EMPTY_COPY[section === 'feed' && scope === 'mine' ? 'mine' : section] || EMPTY_COPY.feed;
  const adminSearch = adminContentSearch.trim().toLocaleLowerCase();
  const filteredAdminPosts = adminPosts.filter((post) => (
    (adminPostFilter === 'all'
      || (adminPostFilter === 'trash' ? Boolean(post.deleted_at) : !post.deleted_at && post.status === adminPostFilter))
    && `${post.title || ''} ${post.content || ''} ${post.username || ''}`.toLocaleLowerCase().includes(adminSearch)
  ));
  const filteredAdminComments = adminComments.filter((comment) => (
    `${comment.content || ''} ${comment.post_title || ''} ${comment.username || ''}`.toLocaleLowerCase().includes(adminSearch)
  ));
  const splashOverlay = splashVisible && <div className={`startup-splash${splashFading ? ' is-fading' : ''}`} aria-hidden="true">
    <img src="/splash.png" alt="" />
  </div>;

  if (!token || !user) return <>{splashOverlay}<main className="auth-screen" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
    <section className="auth-intro">
      <a className="brand auth-brand" href="#welcome"><OmegaMark /><span className="brand-word"><span>{t('أوميجا بلوج')}</span><small>{t('مساحة للكلمة')}</small></span></a>
      <div className="auth-intro-copy"><span className="auth-kicker"><span /> {t('مدوّنة تجمع أصوات وأفكار مختلفة')}</span><h1>{t('كل مقال يفتح')}<br /><em>{t('بابًا لفكرة جديدة.')}</em></h1><p>{t('أوميجا بلوج مساحة للقراءة والكتابة. شارك مقالاتك، واكتشف وجهات نظر وتجارب من كتّاب تانيين.')}</p><div className="auth-quote"><span>“</span><div><p>{t('مقال واحد ممكن يخلّينا نشوف الموضوع من زاوية جديدة.')}</p><small>{t('اقرأ. اكتب. شارك.')}</small></div></div></div>
      <div className="auth-intro-bottom"><span>{t('أوميجا بلوج — مساحة للكلمة')}</span><span>© 2026</span></div>
    </section>
    <section className="auth-panel" id="welcome"><div className="auth-panel-inner"><div className="auth-panel-top"><span>{authScreen === 'contact' ? t('بيانات التواصل') : t('أهلًا بيك في أوميجا بلوج')}</span><span><button className="language-toggle" type="button" onClick={toggleLanguage}>{language === 'ar' ? 'EN' : 'عربي'}</button><button className="theme-toggle" onClick={toggleTheme} aria-label={t('تبديل الوضع الداكن')}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button></span></div>{authScreen !== 'contact' && <div className="auth-heading"><div className="auth-icon"><BookOpen size={21} /></div><h2>{t(authScreen === 'register' ? 'ابدأ التدوين.' : 'أهلًا بعودتك.')}</h2><p>{t(authScreen === 'register' ? 'أنشئ حسابك وانشر مقالاتك للقرّاء.' : 'سجّل دخولك لقراءة المقالات ومتابعة التدوين.')}</p></div>}
      {authScreen !== 'contact' && <div className="auth-tabs"><button className={authScreen === 'login' ? 'selected' : ''} onClick={() => { setAuthScreen('login'); setError(''); }}>{t('تسجيل الدخول')}</button><button className={authScreen === 'register' ? 'selected' : ''} onClick={() => { setAuthScreen('register'); setError(''); }}>{t('إنشاء حساب')}</button></div>}
      {authScreen === 'login' && <><form className="form-stack auth-form" onSubmit={submitAuth}><input type="hidden" name="mode" value="login" /><label>{t('البريد الإلكتروني')}<input type="email" name="email" placeholder="name@example.com" required autoComplete="email" /></label><PasswordField label="كلمة المرور" name="password" t={t} placeholder={t('٨ أحرف على الأقل')} required minLength="8" autoComplete="current-password" />{error && <div className="modal-error auth-error">{t(error)}</div>}<button className="button button-dark form-submit auth-submit" disabled={busy}>{busy ? t('لحظة واحدة...') : t('تسجيل الدخول')} <ArrowLeft size={16} /></button></form><button type="button" className="switch-auth" onClick={() => { setAuthScreen('contact'); loadAdminContact(); setError(''); }}>{t('نسيت كلمة المرور؟')}</button></>}
      {authScreen === 'register' && <form className="form-stack auth-form" onSubmit={submitAuth}><input type="hidden" name="mode" value="register" /><label>{t('اسمك')}<input type="text" name="username" placeholder={t('الاسم اللي الناس هتشوفه')} required maxLength="100" autoComplete="name" /></label><label>{t('البريد الإلكتروني')}<input type="email" name="email" placeholder="name@example.com" required maxLength="255" autoComplete="email" /></label><PasswordField label="كلمة المرور" name="password" t={t} placeholder={t('٨ أحرف على الأقل')} required minLength="8" autoComplete="new-password" />{error && <div className="modal-error auth-error">{t(error)}</div>}<button className="button button-dark form-submit auth-submit" disabled={busy}>{busy ? t('لحظة واحدة...') : t('إنشاء حساب')} <ArrowLeft size={16} /></button></form>}
      {authScreen !== 'contact' && <><div className="auth-terms">{t('بالمتابعة، أنت بتوافق على استخدام أوميجا بلوج باحترام ولطف.')}</div><div className="auth-panel-footer"><span>{t('عندك سؤال؟')}</span><button type="button" onClick={() => { setAuthScreen('contact'); loadAdminContact(); }}>{t('كلّمنا')}</button><span className="auth-footer-divider" /><span>{t('مدوّنة للقرّاء والكتّاب')}</span></div></>}
      {authScreen === 'contact' && <div className="auth-contact-page"><button type="button" className="text-button back-link" onClick={() => setAuthScreen('login')}><ArrowLeft size={14}/>{t('رجوع لتسجيل الدخول')}</button><h2>{t('تواصل مع الأدمن')}</h2><p>{t('لو نسيت كلمة المرور، ابعت بياناتك ورسالتك للأدمن، وهيتواصل معاك.')}</p>{adminContact && <div className="contact-card contact-admin-card"><div className="contact-admin-profile"><Avatar user={adminContact} size="huge"/><b>{adminContact.username}</b></div><div className="contact-row"><span>{t('البريد الإلكتروني')}</span><a href={`mailto:${adminContact.email}`}>{adminContact.email}</a></div>{adminContact.phone && <div className="contact-row"><span>{t('رقم الهاتف')}</span><a href={`tel:${adminContact.phone}`} dir="ltr">{adminContact.phone}</a></div>}</div>}{contactSent ? <div className="contact-success"><Check size={20}/><p>{t('رسالتك وصلت للأدمن بنجاح.')}</p><button className="button button-outline button-small" onClick={() => setContactSent(false)}>{t('إرسال رسالة أخرى')}</button></div> : <form className="form-stack auth-form contact-form" onSubmit={sendPublicContactMessage}><label>{t('الاسم')}<input name="name" required maxLength="100" autoComplete="name" /></label><label>{t('البريد الإلكتروني')}<input name="email" type="email" required maxLength="255" autoComplete="email" /></label><label>{t('رسالتك')}<textarea name="body" required maxLength="4000" rows="4" /></label>{error && <div className="modal-error auth-error">{t(error)}</div>}<button className="button button-dark form-submit" disabled={busy}>{busy ? t('جارٍ الإرسال...') : t('إرسال الرسالة')} <Send size={15}/></button></form>}</div>}
    </div></section>
    {notice && <div className="toast"><Check size={17} />{t(notice)}</div>}
  </main></>;

  const headerTitle = t(navItems.find((item) => item.id === section)?.label || 'كل المقالات');

  return <>{splashOverlay}<div className={`app-shell ${dark ? 'theme-dark' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
    {forcePasswordChange && <div className="modal-backdrop force-password-backdrop"><form className="modal form-stack" onSubmit={submitForcedPasswordChange}><div className="modal-icon"><ShieldCheck size={20}/></div><h2>{t('غيّر كلمة مرورك')}</h2><p className="modal-subtitle">{t('استخدم كلمة المرور المؤقتة التي أرسلها الأدمن، ثم اختر كلمة مرور جديدة.')}</p><label>{t('كلمة المرور المؤقتة')}<input name="currentPassword" type="password" required autoComplete="current-password"/></label><label>{t('كلمة المرور الجديدة')}<input name="newPassword" type="password" required minLength="8" autoComplete="new-password"/></label>{error && <div className="modal-error">{t(error)}</div>}<button className="button button-dark" disabled={busy}>{busy ? t('بنحفظ...') : t('حفظ كلمة المرور')}</button></form></div>}
    <header className="topbar">
      <a className="brand" href="#top" aria-label={`${t('أوميجا بلوج')}، ${t('كل المقالات')}`}><OmegaMark /><span className="brand-word"><span>{t('أوميجا بلوج')}</span><small>{t('مساحة للكلمة')}</small></span></a>
      <nav className="desktop-nav"><button className={section === 'feed' && scope === 'all' ? 'nav-active' : ''} onClick={() => { setScope('all'); goTo('feed'); }}>{t('كل المقالات')}</button><button className={section === 'feed' && scope === 'mine' ? 'nav-active' : ''} onClick={() => goTo('mine')}>{t('منشوراتي')}</button>{SECTIONS.filter((item) => item.id !== 'feed').map((item) => <button key={item.id} className={section === item.id ? 'nav-active' : ''} onClick={() => goTo(item.id)}>{t(item.label)}</button>)}</nav>
      <div className="header-actions">
        <button className="language-toggle" type="button" onClick={toggleLanguage} aria-label={t('لغة الواجهة')} title={t('لغة الواجهة')}>{language === 'ar' ? 'EN' : 'عربي'}</button>
        <button className="icon-button" onClick={toggleTheme} aria-label={t('تبديل الوضع الداكن')}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button className="button button-dark button-small" onClick={() => { setEditing(null); setModal('compose'); }}><PenLine size={15} /> {t('اكتب')}</button>
        <button className="account-chip" onClick={() => goTo('profile')} title={t('صفحتي الشخصية')}><Avatar user={user} /><span>{user.username}{isAdmin && <em className="admin-tag">{t('أدمن')}</em>}</span></button>
        <button className="icon-button" onClick={logout} aria-label={t('تسجيل الخروج')}><LogOut size={17} /></button>
        <button className="icon-button menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={t('القائمة')}><Menu size={19} /></button>
      </div>
    </header>

    {menuOpen && <nav className="mobile-menu"><button className={section === 'feed' && scope === 'all' ? 'active' : ''} onClick={() => { setScope('all'); goTo('feed'); }}><LayoutList size={16} /> {t('كل المقالات')}</button><button className={section === 'feed' && scope === 'mine' ? 'active' : ''} onClick={() => goTo('mine')}><UserRound size={16} /> {t('منشوراتي')}</button>{navItems.filter((item) => item.id !== 'feed').map((item) => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => goTo(item.id)}><item.icon size={16} /> {t(item.label)}</button>)}</nav>}

    <div className="layout">
      <aside className="sidebar">
        <button className="sidebar-profile" onClick={() => goTo('profile')} title={t('صفحتي الشخصية')}><Avatar user={user} size="big" /><div><b>{user.username}</b><small>{t(isAdmin ? 'مدير الموقع' : 'كاتب في أوميجا بلوج')}</small></div></button>
        <nav><button className={section === 'feed' && scope === 'all' ? 'active' : ''} onClick={() => { setScope('all'); goTo('feed'); }}><LayoutList size={17} /> {t('كل المقالات')}</button><button className={section === 'feed' && scope === 'mine' ? 'active' : ''} onClick={() => goTo('mine')}><UserRound size={17} /> {t('منشوراتي')}</button>{navItems.filter((item) => item.id !== 'feed').map((item) => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => goTo(item.id)}><item.icon size={17} /> {t(item.label)}{item.badge && unreadMessageCount > 0 && <span className="nav-badge">{unreadMessageCount}</span>}</button>)}</nav>
        <button className="button button-dark sidebar-compose" onClick={() => { setEditing(null); setModal('compose'); }}><PlusIcon /> {t('مقال جديد')}</button>
      </aside>

      <main className="content" id="top">
        {error && !modal && <div className="inline-error">{t(error)} <button onClick={() => loadSection(section)}>{t('إعادة المحاولة')}</button></div>}

        {section === 'feed' && <>
          <div className="feed-heading">
            <div><h1>{t(scope === 'mine' ? 'منشوراتي' : 'كل المقالات')}</h1><p>{countText(posts.length, 'post', 'posts', 'مقال')}</p></div>
            <div className="feed-tabs">
              <button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>{t('الكل')}</button>
              <button className={scope === 'mine' ? 'active' : ''} onClick={() => setScope('mine')}>{t('مقالاتي')}</button>
            </div>
          </div>
          <section className="composer-card">
            <Avatar user={user} />
            <button className="composer-input" onClick={() => { setEditing(null); setModal('compose'); }}>{t('بتفكر في إيه؟ اكتب حكاية جديدة...')}</button>
          </section>
          <div className="feed">
            {!loadingSection && posts.map((post, index) => <article className="post-card" key={post.id}>
              <header className="post-head">
                <button type="button" className="post-author-link" onClick={() => openUserPage(post.user_id)} title={t('عرض حساب')}>
                  <Avatar user={postAvatar(post)} />
                  <span className="post-author"><b>{post.username}</b><small>{dateLabel(post.created_at, language)}{post.updated_at && post.updated_at !== post.created_at ? ` · ${t('معدّل')}` : ''}</small></span>
                </button>
                {post.status === 'draft' && <span className="pill">{t('مسودة')}</span>}
                {post.user_id === user.id && canManage(post) && post.status === 'draft' && <button className="link-button" onClick={() => setPostStatus(post, 'published')}>{t('نشر')}</button>}
              </header>
              <h2 className="post-title" onClick={() => openPost(post)}>{post.title || t('بدون عنوان')}</h2>
              <p className="post-body">{post.content}</p>
              <footer className="post-actions">
                <button className={`engage-button ${post.my_reaction === 'like' ? 'reacted' : ''}`} onClick={() => reactToPost(post)} aria-pressed={post.my_reaction === 'like'} aria-label={t('إعجاب')}><Heart size={17} fill={post.my_reaction === 'like' ? 'currentColor' : 'none'} /> <span>{Number(post.like_count || 0)}</span></button>
                <button className="engage-button" onClick={() => openPost(post)}><MessageCircle size={17} /> <span>{Number(post.comment_count || 0)}</span></button>
                <button className="read-more" onClick={() => openPost(post)}>{t('اقرأ المقال')} <ArrowLeft size={15} /></button>
                {canManage(post) && <div className="post-manage">
                  <button className="icon-button" onClick={() => { setEditing(post); setModal('compose'); }} aria-label={t('تعديل')}><PenLine size={16} /></button>
                  <button className="icon-button danger" onClick={() => trashPost(post)} aria-label={t('حذف')}><Trash2 size={16} /></button>
                </div>}              </footer>
            </article>)}
            {loadingSection && <div className="empty-state loading-state"><span className="empty-icon"><BookOpen /></span><h3>{t('جارٍ تحميل المقالات...')}</h3><p>{t('لحظات ونحدّث القائمة.')}</p></div>}
            {!loadingSection && posts.length === 0 && <div className="empty-state"><span className="empty-icon"><BookOpen /></span><h3>{t(emptyCopy.title)}</h3><p>{t(emptyCopy.body)}</p><button className="button button-dark" onClick={() => { setEditing(null); setModal('compose'); }}>{t('اكتب مقال')} <ArrowLeft size={15} /></button></div>}
          </div>
        </>}

        {section === 'drafts' && <div className="feed">
          <div className="feed-heading"><div><h1>{t('المسودات')}</h1><p>{countText(posts.length, 'draft', 'drafts', 'مسودة')}</p></div></div>
          {loadingSection && <div className="empty-state loading-state"><span className="empty-icon"><FileText /></span><h3>{t('بنحمّل المسودات...')}</h3><p>{t('ثواني ونجيب آخر مسودات حسابك.')}</p></div>}
          {!loadingSection && posts.length === 0 && <div className="empty-state"><span className="empty-icon"><FileText /></span><h3>{t(emptyCopy.title)}</h3><p>{t(emptyCopy.body)}</p></div>}
          {!loadingSection && posts.map((post) => <article className="post-card" key={post.id}>
            <header className="post-head"><button type="button" className="post-author-link" onClick={() => openUserPage(post.user_id)} title={t('عرض حساب')}><Avatar user={postAvatar(post)} /><span className="post-author"><b>{post.username}</b><small>{t('آخر تعديل')} {dateLabel(post.updated_at, language)}</small></span></button><span className="pill">{t('مسودة')}</span></header>
            <h2 className="post-title">{post.title || t('بدون عنوان')}</h2>
            <p className="post-body">{post.content}</p>
            <footer className="post-actions">
              <button className="button button-dark button-small" onClick={() => setPostStatus(post, 'published')}>{t('نشر المقال')}</button>
              <button className="text-button" onClick={() => { setEditing(post); setModal('compose'); }}>{t('تعديل')}</button>
              <button className="icon-button danger" onClick={() => trashPost(post)} aria-label={t('حذف')}><Trash2 size={16} /></button>
            </footer>
          </article>)}
        </div>}

        {section === 'trash' && <div className="feed">
          <div className="feed-heading"><div><h1>{t('سلة المحذوفات')}</h1><p>{countText(posts.length, 'post', 'posts', 'مقال')}</p></div></div>
          {posts.length === 0 && <div className="empty-state"><span className="empty-icon"><Trash2 /></span><h3>{t(emptyCopy.title)}</h3><p>{t(emptyCopy.body)}</p></div>}
          {!loadingSection && posts.map((post) => <article className="post-card" key={post.id}>
            <header className="post-head"><button type="button" className="post-author-link" onClick={() => openUserPage(post.user_id)} title={t('عرض حساب')}><Avatar user={postAvatar(post)} /><span className="post-author"><b>{post.username}</b><small>{t('اتحذف')} {dateLabel(post.deleted_at, language)}</small></span></button></header>
            <h2 className="post-title">{post.title || t('بدون عنوان')}</h2>
            <p className="post-body">{post.content}</p>
            <footer className="post-actions">
              <button className="button button-dark button-small" onClick={() => restorePost(post)}><RotateCcw size={15} /> {t('استعادة')}</button>
              <button className="button button-outline button-small danger-text" onClick={() => purgePost(post)}><Trash2 size={15} /> {t('حذف نهائي')}</button>
            </footer>
          </article>)}
        </div>}

        {section === 'messages' && <div className="admin-panel">
          <div className="feed-heading"><div><h1>{t('الرسائل')}</h1><p>{t('راسل الأدمن — لو نسيت كلمة المرور اطلب رمز جديد من هنا.')}</p></div><button className="button button-outline button-small" onClick={loadConversation} disabled={loadingSection}><RotateCcw size={14} /> {t('تحديث الرسائل')}</button></div>
          <div className="chat">
            {conversationMessages.length === 0 && <p className="chat-empty">{t('لا توجد رسائل بعد. ابدأ بالتواصل مع الأدمن.')}</p>}
            {conversationMessages.map((message) => <div key={message.id} className={`chat-bubble ${message.sender_role === 'admin' ? 'from-admin' : 'from-user'}`}>
              <small>{message.sender_role === 'admin' ? t('الأدمن') : user.username}</small>
              <p>{message.body}</p>
            </div>)}
            {conversationMessages.length > 0 && conversationMessages[conversationMessages.length - 1].sender_role === 'user' && <p className="chat-waiting">{t('جارٍ انتظار رد الأدمن...')}</p>}
          </div>
          <form className="chat-form" onSubmit={sendUserMessage}>
            <input name="body" placeholder={t('اكتب رسالتك...')} maxLength="4000" required />
            <button className="button button-dark button-small"><Send size={15} /> {t('إرسال')}</button>
          </form>
        </div>}

        {section === 'contact' && <div className="admin-panel">
          <div className="feed-heading"><div><h1>{t('تواصل مع الأدمن')}</h1><p>{t('بيانات التواصل')}</p></div></div>
          {adminContact && <div className="contact-card contact-admin-card"><div className="contact-admin-profile"><Avatar user={adminContact} size="big"/><b>{adminContact.username}</b></div><div className="contact-row"><span>{t('البريد الإلكتروني')}</span><a href={`mailto:${adminContact.email}`}>{adminContact.email}</a></div>{adminContact.phone && <div className="contact-row"><span>{t('رقم الهاتف')}</span><a href={`tel:${adminContact.phone}`} dir="ltr">{adminContact.phone}</a></div>}</div>}
          {contactSent ? <div className="contact-success"><Check size={20}/><p>{t('رسالتك وصلت للأدمن بنجاح.')}</p><button className="button button-outline button-small" onClick={() => setContactSent(false)}>{t('إرسال رسالة أخرى')}</button></div> : <form className="form-stack contact-form" onSubmit={sendPublicContactMessage}><label>{t('الاسم')}<input name="name" required maxLength="100" autoComplete="name" defaultValue={user?.username || ''}/></label><label>{t('البريد الإلكتروني')}<input name="email" type="email" required maxLength="255" autoComplete="email" defaultValue={user?.email || ''}/></label><label>{t('رسالتك')}<textarea name="body" required maxLength="4000" rows="4"/></label>{error && <div className="modal-error auth-error">{t(error)}</div>}<button className="button button-dark form-submit" disabled={busy}>{busy ? t('جارٍ الإرسال...') : t('إرسال الرسالة')} <Send size={15}/></button></form>}
        </div>}

        {isAdmin && section === 'admin-messages' && <div className="admin-panel">
          <div className="feed-heading"><div><h1>{t('رسائل المستخدمين')} {unreadMessageCount > 0 && <span className="message-count-badge">{unreadMessageCount}</span>}</h1><p>{t('طلبات استعادة كلمة المرور وغيرها.')}</p></div><button className="button button-outline button-small" onClick={loadAdminThreads}><RotateCcw size={14} /> {t('تحديث الرسائل')}</button></div>
          <div className="inbox">
            <div className="inbox-list">
              {adminThreads.length === 0 && <p className="hint">{t('لا توجد رسائل بعد. ابدأ بالتواصل مع الأدمن.')}</p>}
              {adminThreads.map((thread) => <div key={thread.id} className={`inbox-item-wrap ${activeAdminThread?.id === thread.id ? 'active' : ''}`}><button className="inbox-item" onClick={() => openAdminThread(thread)}>
                <Avatar user={thread} />
                <span><b>{thread.username || t('حساب غير معروف')}</b><small>{thread.email || ''}</small><small>{thread.latest_message || ''}</small></span>
                {Number(thread.unread_count) > 0 && <span className="message-count-badge">{thread.unread_count}</span>}
              </button><button className="icon-button danger inbox-delete" title={t('حذف المحادثة')} onClick={async () => { if (!window.confirm(t('تحذف المحادثة دي بكل رسائلها؟'))) return; try { await request(`/admin/messages/${thread.id}`, { token, method: 'DELETE' }); setAdminThreads((items) => items.filter((item) => item.id !== thread.id)); if (activeAdminThread?.id === thread.id) { setActiveAdminThread(null); setActiveAdminMessages([]); } await loadAdminThreads(); } catch (e) { setError(e.message); } }}><Trash size={15}/></button></div>)}
            </div>
            <div className="inbox-thread">
              {!activeAdminThread && <p className="hint">{t('اختر محادثة لعرض الرسائل.')}</p>}
              {activeAdminThread && <>
                <div className="chat">
                  {activeAdminMessages.map((message) => <div key={message.id} className={`admin-message-row ${message.sender_role === 'admin' ? 'from-admin' : 'from-user'}`}><div className={`chat-bubble ${message.sender_role === 'admin' ? 'from-admin' : 'from-user'}`}>
                    <small>{message.sender_role === 'admin' ? t('الأدمن') : activeAdminThread.username}</small>
                    <p>{message.body}</p>
                  </div><button className="icon-button danger message-delete" title={t('حذف الرسالة')} onClick={() => deleteAdminMessage(message)}><Trash size={14}/></button></div>)}
                </div>
                <button className="button button-outline button-small" onClick={() => sendResetCodeToThread(activeAdminThread)} disabled={!activeAdminThread.reset_user_id && !activeAdminThread.user_id}><ShieldCheck size={14} /> {t('إرسال كلمة مرور مؤقتة')}</button>
                <form className="chat-form" onSubmit={sendAdminReply}>
                  <input name="body" placeholder={t('اكتب رسالتك...')} maxLength="4000" required />
                  <button className="button button-dark button-small"><Send size={15} /> {t('إرسال')}</button>
                </form>
              </>}
            </div>
          </div>
        </div>}

        {section === 'user' && <div className="admin-panel">
          <button className="text-button back-link" onClick={() => goTo('feed')}><ArrowLeft size={14} /> {t('العودة للمقالات')}</button>
          {!publicProfile && <p className="hint">{t('جارٍ تحميل المقالات...')}</p>}
          {publicProfile && <>
            <div className="profile-hero"><Avatar user={publicProfile} size="huge" /><div><b>{publicProfile.username}</b><p>{t('عضو من')} {dateLabel(publicProfile.created_at, language)}</p><span className={`pill ${publicProfile.role === 'admin' ? 'pill-admin' : ''}`}>{t(publicProfile.role === 'admin' ? 'أدمن' : 'كاتب')}</span></div></div>
            <div className="feed">
              {publicProfilePosts.length === 0 && <div className="empty-state"><span className="empty-icon"><BookOpen /></span><h3>{t('لا توجد منشورات منشورة بعد.')}</h3></div>}
              {publicProfilePosts.map((post) => <article className="post-card" key={post.id}>
                <h2 className="post-title" onClick={() => openPost(post)}>{post.title || t('بدون عنوان')}</h2>
                <p className="post-body">{post.content}</p>
                <footer className="post-actions">
                  <span className="engage-button"><Heart size={16} /> <span>{Number(post.like_count || 0)}</span></span>
                  <span className="engage-button"><MessageCircle size={16} /> <span>{Number(post.comment_count || 0)}</span></span>
                  <button className="read-more" onClick={() => openPost(post)}>{t('اقرأ المقال')} <ArrowLeft size={15} /></button>
                </footer>
              </article>)}
            </div>
          </>}
        </div>}

        {section === 'users' && <div className="admin-panel">
          <div className="feed-heading"><div><h1>{t('إدارة المستخدمين')}</h1><p>{countText(users.length, 'user', 'users', 'مستخدم')}</p></div></div>
          <table className="admin-table"><thead><tr><th>{t('المستخدم')}</th><th>{t('البريد الإلكتروني')}</th><th>{t('الصلاحية')}</th><th>{t('إجراءات')}</th></tr></thead>
            <tbody>{users.map((item) => <tr key={item.id}>
              <td>{item.username}{String(item.id) === String(user.id) && <small className="current-user-tag">{t('(أنت)')}</small>}</td>
              <td className="mono">{item.email}</td>
              <td><span className={`pill ${item.role === 'admin' ? 'pill-admin' : ''}`}>{t(item.role === 'admin' ? 'أدمن' : 'كاتب')}</span></td>
              <td className="row-actions">
                <button className="text-button" disabled={String(item.id) === String(user.id) && item.role === 'admin'} title={String(item.id) === String(user.id) && item.role === 'admin' ? t('لا يمكنك إزالة صلاحية الأدمن من حسابك هنا.') : undefined} onClick={() => changeRole(item, item.role === 'admin' ? 'user' : 'admin')}>{t(item.role === 'admin' ? 'تنزيل لكاتب' : 'ترقية لأدمن')}</button>
                <button className="icon-button danger" onClick={() => deleteUser(item)} aria-label={t('حذف المستخدم')}><Trash2 size={16} /></button>
              </td>
            </tr>)}</tbody>
          </table>
        </div>}

        {section === 'profile' && <div className="admin-panel">
          <div className="feed-heading"><div><h1>{t('حسابي')}</h1><p>{t('عدّل بياناتك وصورتك الشخصية.')}</p></div></div>
          <div className="profile-hero">
            <label className="avatar-picker" title={t('تغيير الصورة الشخصية')}>
              <Avatar user={{ ...(profileForm || user), avatar_url: avatarDraft }} size="huge" />
              <span className="avatar-picker-badge"><PenLine size={13} /></span>
              <input type="file" accept="image/*" onChange={pickAvatar} aria-label={t('تغيير الصورة الشخصية')} />
            </label>
            <div><b>{profileForm?.username || user.username}</b><p>{t('عضو من')} {dateLabel(profileForm?.created_at || user.created_at, language)}</p><span className={`pill ${isAdmin ? 'pill-admin' : ''}`}>{t(isAdmin ? 'أدمن' : 'كاتب')}</span></div>
            {avatarDraft !== (profileForm?.avatar_url || '') && <button type="button" className="button button-dark button-small avatar-save" disabled={busy} onClick={saveAvatar}>{busy ? t('بنحفظ...') : t('حفظ الصورة')}</button>}
          </div>
          {!profileForm && <p className="hint">{t('بنحمّل بيانات حسابك...')}</p>}
          {profileForm && <form className="form-stack profile-form" onSubmit={saveProfile}>
            <div className="profile-grid">
              <label>{t('الاسم الظاهر')}<input name="username" defaultValue={profileForm.username} required maxLength="100" /></label>
              <label>{t('البريد الإلكتروني')}<input type="email" name="email" defaultValue={profileForm.email} required maxLength="255" /></label>
              <label>{t('العمر')} ({t('اختياري')})<input type="number" name="age" min="13" max="120" defaultValue={profileForm.age ?? ''} placeholder={t('مثال: 25')} /></label>
              <label>{t('رقم الهاتف')} ({t('اختياري')})<input type="tel" name="phone" maxLength="30" defaultValue={profileForm.phone || ''} placeholder="+201000000000" autoComplete="tel" /></label>
            </div>
            <div className="compose-actions"><button className="button button-dark" disabled={busy}><Save size={15} /> {busy ? t('بنحفظ...') : t('حفظ التعديلات')}</button></div>
          </form>}
        </div>}

        {section === 'admin-content' && <div className="admin-panel">
          <div className="feed-heading"><div><h1>{t('إدارة المحتوى')}</h1><p>{t('راجع المنشورات والتعليقات، واتخذ إجراءً على كل عنصر.')}</p></div><button className="button button-outline button-small" onClick={loadAdminContent} disabled={loadingSection}><RotateCcw size={14} /> {t('تحديث')}</button></div>
          <section className="admin-overview" aria-label={t('ملخص البيانات')}>
            <article className="admin-overview-card"><span>{t('إجمالي المنشورات')}</span><strong>{adminOverview?.post_count ?? '—'}</strong><small>{adminOverview ? `${adminOverview.published_post_count} ${t('منشور')} · ${adminOverview.draft_post_count} ${t('مسودة')} · ${adminOverview.trashed_post_count} ${t('في سلة المحذوفات')}` : t('جارٍ تحميل المحتوى...')}</small></article>
            <article className="admin-overview-card"><span>{t('التعليقات')}</span><strong>{adminOverview?.comment_count ?? '—'}</strong><small>{t('على جميع المنشورات')}</small></article>
            <article className="admin-overview-card"><span>{t('عدد المستخدمين')}</span><strong>{adminOverview?.user_count ?? '—'}</strong><small>{t('حساب مسجل')}</small></article>
            <article className="admin-overview-card"><span>{t('التفاعلات')}</span><strong>{adminOverview?.reaction_count ?? '—'}</strong><small>{t('إعجاب وتفاعل')}</small></article>
            <article className="admin-overview-card"><span>{t('حجم قاعدة البيانات')}</span><strong className="admin-overview-size" title={adminOverview ? `${Number(adminOverview.database_size_bytes).toLocaleString()} ${t('بايت')}` : ''}>{adminOverview?.database_size || '—'}</strong><small>{t('يشمل الجداول والفهارس')}</small></article>
            <article className="admin-overview-card"><span>{t('آخر نشاط مسجل')}</span><strong className="admin-overview-activity">{dateTimeLabel(adminOverview?.last_activity_at, language)}</strong><small>{t('آخر تحديث للمحتوى أو التفاعل')}</small></article>
          </section>
          <div className="admin-content-tabs" role="tablist" aria-label={t('نوع المحتوى')}>
            <button className={adminContentTab === 'posts' ? 'active' : ''} onClick={() => setAdminContentTab('posts')} role="tab" aria-selected={adminContentTab === 'posts'}>{t('المنشورات')} <span>{adminPosts.length}</span></button>
            <button className={adminContentTab === 'comments' ? 'active' : ''} onClick={() => setAdminContentTab('comments')} role="tab" aria-selected={adminContentTab === 'comments'}>{t('التعليقات')} <span>{adminComments.length}</span></button>
          </div>
          <input className="admin-content-search" type="search" value={adminContentSearch} onChange={(event) => setAdminContentSearch(event.target.value)} placeholder={t(adminContentTab === 'posts' ? 'ابحث بالعنوان أو النص أو الكاتب...' : 'ابحث بالتعليق أو المنشور أو الكاتب...')} aria-label={t(adminContentTab === 'posts' ? 'ابحث بالعنوان أو النص أو الكاتب...' : 'ابحث بالتعليق أو المنشور أو الكاتب...')} />
          {adminContentTab === 'posts' && <>
            <div className="admin-content-filters" aria-label={t('تصفية المنشورات')}>
              {[
                ['all', 'الكل', adminPosts.length],
                ['published', 'منشور', adminPosts.filter((post) => post.status === 'published' && !post.deleted_at).length],
                ['draft', 'مسودة', adminPosts.filter((post) => post.status === 'draft' && !post.deleted_at).length],
                ['trash', 'سلة المحذوفات', adminPosts.filter((post) => post.deleted_at).length],
              ].map(([value, label, count]) => <button key={value} className={adminPostFilter === value ? 'active' : ''} onClick={() => setAdminPostFilter(value)}>{t(label)} <span>{count}</span></button>)}
            </div>
            {loadingSection ? <div className="empty-state"><h3>{t('جارٍ تحميل المحتوى...')}</h3></div> : <div className="admin-content-list">
              {filteredAdminPosts.map((post) => <article className="admin-content-item" key={post.id}>
                  <div className="admin-content-item-main">
                    <span className={`pill ${post.deleted_at ? 'pill-deleted' : post.status === 'draft' ? 'pill-draft' : 'pill-published'}`}>{t(post.deleted_at ? 'في سلة المحذوفات' : post.status === 'draft' ? 'مسودة' : 'منشور')}</span>
                    <h2>{post.title || t('بدون عنوان')}</h2>
                    <p>{post.content}</p>
                    <small>{t('بواسطة')} {post.username} · {dateLabel(post.updated_at, language)} · {Number(post.comment_count || 0)} {t('تعليقات')}</small>
                  </div>
                  <div className="admin-content-actions">
                    {post.deleted_at
                      ? <><button className="button button-outline button-small" onClick={() => manageAdminPost(post, 'restore')}><RotateCcw size={14} /> {t('استعادة')}</button><button className="button button-outline button-small danger-text" onClick={() => manageAdminPost(post, 'purge')}><Trash2 size={14} /> {t('حذف نهائي')}</button></>
                      : <><button className="button button-outline button-small" onClick={() => { setEditing(post); setModal('compose'); }}><PenLine size={14} /> {t('تعديل')}</button><button className="button button-outline button-small" onClick={() => manageAdminPost(post, post.status === 'draft' ? 'publish' : 'draft')}>{post.status === 'draft' ? t('نشر') : t('تحويل لمسودة')}</button><button className="icon-button danger" onClick={() => manageAdminPost(post, 'trash')} aria-label={t('نقل لسلة المحذوفات')}><Trash2 size={16} /></button></>}
                  </div>
                </article>)}
              {filteredAdminPosts.length === 0
                && <div className="empty-state"><h3>{t('لا توجد منشورات في هذا القسم.')}</h3></div>}
            </div>}
          </>}
          {adminContentTab === 'comments' && (loadingSection ? <div className="empty-state"><h3>{t('جارٍ تحميل المحتوى...')}</h3></div> : <div className="admin-content-list">
            {filteredAdminComments.map((comment) => <article className="admin-content-item comment-admin-item" key={comment.id}>
              <div className="admin-content-item-main"><span className="pill">{t('تعليق')}</span><h2>{comment.post_title || t('منشور محذوف')}</h2><p>{comment.content}</p><small>{t('بواسطة')} {comment.username} · {dateLabel(comment.created_at, language)}</small></div>
              <div className="admin-content-actions"><button className="button button-outline button-small danger-text" onClick={() => removeAdminComment(comment)}><Trash2 size={14} /> {t('حذف التعليق')}</button></div>
            </article>)}
            {filteredAdminComments.length === 0 && <div className="empty-state"><h3>{t('لا توجد تعليقات.')}</h3></div>}
          </div>)}
        </div>}
      </main>

      <aside className="right-rail">
        <div className="rail-card"><b>{t('أهلًا،')} {user.username}</b><p>{t(isAdmin ? 'عندك صلاحية أدمن لكامل المحتوى والمستخدمين.' : 'شارك أفكارك واقرأ اللي بيحصل في المجتمع.')}</p></div>
        {isAdmin && <button className="rail-link" onClick={() => goTo('admin-content')}><ShieldCheck size={16} /> {t('أدوات الأدمن')}</button>}
        <div className="rail-card muted"><b>{t('نصيحة')}</b><p>{t('استخدم «حفظ كمسودة» لو الكتابة محتاجة وقت، وانشرها لما تكون جاهزة.')}</p></div>
      </aside>
    </div>

    {notice && <div className="toast"><Check size={17} />{t(notice)}</div>}
    {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}><section className={`modal ${modal === 'post' ? 'post-modal' : ''}`} role="dialog" aria-modal="true">
      <button className="modal-close" onClick={closeModal} aria-label="إغلاق"><X size={20} /></button>
      {error && <div className="modal-error">{t(error)}</div>}
      {(modal === 'auth' || modal === 'register') && <><div className="modal-icon"><BookOpen size={21} /></div><div className="eyebrow"><span className="eyebrow-line" /> {t('أهلًا بيك في أوميجا بلوج')}</div><h2>{t(modal === 'register' ? 'مكانك مستنيك.' : 'وحشتنا.')}</h2><p className="modal-subtitle">{t(modal === 'register' ? 'اعمل حساب وابدأ تشارك أفكارك.' : 'سجّل دخولك عشان تكمّل رحلتك.')}</p><form className="form-stack" onSubmit={submitAuth}><input type="hidden" name="mode" value={modal === 'register' ? 'register' : 'login'} />{modal === 'register' && <label>{t('اسمك')}<input name="username" placeholder={t('الاسم اللي الناس هتشوفه')} required maxLength="100" /></label>}<label>{t('البريد الإلكتروني')}<input type="email" name="email" placeholder="name@example.com" required /></label><label>{t('كلمة المرور')}<input type="password" name="password" placeholder={t('٨ أحرف على الأقل')} required minLength="8" /></label><button className="button button-dark form-submit" disabled={busy}>{busy ? t('لحظة واحدة...') : modal === 'register' ? t('إنشاء حساب') : t('دخول')} <ArrowLeft size={16} /></button></form><button className="switch-auth" onClick={() => { setError(''); setModal(modal === 'register' ? 'auth' : 'register'); }}>{t(modal === 'register' ? 'عندك حساب؟ سجّل دخولك' : 'لسه جديد؟ اعمل حساب')}</button></>}
      {modal === 'compose' && <><div className="eyebrow"><span className="eyebrow-line" /> {t('مساحة حكايتك')}</div><h2>{t(editing ? 'تعديل المقال.' : 'اكتب اللي جواك.')}</h2><p className="modal-subtitle">{t('مش لازم يكون كامل. تقدر تحفظه مسودة وترجع له.')}</p><form className="form-stack" onSubmit={(event) => submitPost(event, 'published')}><label>{t('عنوان المقال')}<input name="title" placeholder={t('إيه الفكرة اللي شاغلاك؟')} maxLength="200" defaultValue={editing?.title || ''} /></label><label>{t('المقال')}<textarea name="content" placeholder={t('ابدأ من أي حتة...')} maxLength="50000" rows="8" defaultValue={editing?.content || ''} /></label><div className="compose-actions"><button type="button" className="button button-outline" disabled={busy} onClick={(event) => submitPost(event, 'draft')}>{t('حفظ كمسودة')}</button><button className="button button-dark" disabled={busy}>{busy ? t('بنحفظ...') : t('نشر المقال')} <Send size={15} /></button></div></form></>}
      {modal === 'post' && activePost && <><div className="post-detail-meta"><Avatar user={postAvatar(activePost)} /><span>{activePost.username}</span><span>·</span><time>{dateLabel(activePost.created_at, language)}</time>{activePost.status === 'draft' && <span className="pill">{t('مسودة')}</span>}</div><h2 className="post-detail-title">{activePost.title || t('بدون عنوان')}</h2><div className="post-detail-content">{activePost.content}</div>
        <div className="detail-bar"><button className={`engage-button ${activePost.my_reaction === 'like' ? 'reacted' : ''}`} onClick={() => reactToPost(activePost)}><Heart size={17} fill={activePost.my_reaction === 'like' ? 'currentColor' : 'none'} /> <span>{Number(activePost.like_count || 0)} {t('إعجاب')}</span></button>{canManage(activePost) && <><button className="text-button" onClick={() => { setEditing(activePost); setModal('compose'); }}>{t('تعديل')}</button><button className="text-button danger-text" onClick={async () => { await trashPost(activePost); closeModal(); }}>{t('حذف')}</button></>}</div>
        <div className="comments-area"><h3>{t('التعليقات')} <span>{comments.length}</span></h3>{token ? <form className="comment-form" onSubmit={submitComment}><input name="content" placeholder={t('اكتب تعليقك...')} required maxLength="10000" /><button className="button button-dark button-small" disabled={busy}>{t('إرسال')} <Send size={14} /></button></form> : <button className="comment-login" onClick={() => setModal('auth')}>{t('سجّل دخولك عشان تسيب تعليق')}</button>}
          <div className="comment-list">{comments.map((comment) => <div className="comment-item" key={comment.id}><span className="author-avatar">{initial(comment.username)}</span><div className="comment-body"><b>{comment.username}</b><p>{comment.content}</p></div>{(isAdmin || String(comment.user_id) === String(user.id)) && <button className="icon-button danger comment-delete" onClick={() => removeComment(comment)} aria-label={t('حذف التعليق')}><Trash2 size={15} /></button>}</div>)}{comments.length === 0 && <p className="no-comments">{t('لسه مفيش تعليقات. افتح الكلام.')}</p>}</div></div></>}
    </section></div>}
  </div></>;
}

function PlusIcon() { return <span className="plus-icon"><ArrowUpLeft size={15} /></span>; }

function OmegaMark() {
  return <span className="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="19" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="Georgia, 'Times New Roman', serif" fontSize="21" fontWeight="600">Ω</text>
      <circle cx="19" cy="5" r="1.1" fill="#bd8258" stroke="none" />
    </svg>
  </span>;
}

createRoot(document.getElementById('root')).render(<App />);
