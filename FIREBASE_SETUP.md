# Firebase Setup Guide - Fix Permissions Issue

## 🔴 Current Issue

You're seeing the error: **"Missing or insufficient permissions"**

This happens because your Firestore database has security rules that block read/write access.

## ✅ Solution: Update Firestore Security Rules

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **face-recoginition-de3f4**
3. Click on **Firestore Database** in the left menu
4. Click on the **Rules** tab

### Step 2: Update Security Rules

Replace the existing rules with these **development rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to the faces collection
    match /faces/{faceId} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish the Rules

1. Click **Publish** button
2. Wait for confirmation (usually takes a few seconds)

### Step 4: Test Your App

1. Refresh your web app
2. Try registering a face again
3. The error should be gone! ✅

---

## 🔒 Production Security Rules (Use Later)

For production, use these more secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /faces/{faceId} {
      // Allow anyone to read faces (for recognition)
      allow read: if true;
      
      // Only allow writes if authenticated (you'll need Firebase Auth)
      allow write: if request.auth != null;
    }
  }
}
```

To use production rules, you'll need to:
1. Enable Firebase Authentication
2. Add sign-in to your app
3. Update the rules as shown above

---

## 🎯 Quick Fix (Copy-Paste Ready)

### Development Rules (Use Now)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /faces/{faceId} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning**: These rules allow anyone to read/write. Only use for development!

---

## 📊 Verify It's Working

After updating the rules, you should see:

### Registration Page:
- ✅ "Face captured successfully!"
- ✅ "Saving to database..."
- ✅ "Registration Successful!"
- ✅ Redirect to recognition page

### Recognition Page:
- ✅ Camera starts automatically
- ✅ No "Failed to load stored faces" error
- ✅ Faces detected and recognized
- ✅ User information displayed

---

## 🐛 Still Having Issues?

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors

### Common Issues:

**Issue**: "Failed to load stored faces"
**Solution**: Make sure Firestore rules are published

**Issue**: "Missing or insufficient permissions"
**Solution**: Double-check the rules match exactly as shown above

**Issue**: Network errors
**Solution**: Check internet connection

---

## 📝 Current Firebase Configuration

Your app is using:
- **Project ID**: face-recoginition-de3f4
- **Collection**: faces
- **Auth Domain**: face-recoginition-de3f4.firebaseapp.com

---

## 🎉 After Fixing

Once the rules are updated, your app will:
1. ✅ Save face embeddings to Firestore
2. ✅ Load registered faces on recognition page
3. ✅ Recognize faces in real-time
4. ✅ Display user information

---

## 🔗 Helpful Links

- [Firebase Console](https://console.firebase.google.com/project/face-recoginition-de3f4/firestore/rules)
- [Firestore Security Rules Docs](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)

---

**Need Help?** Check the browser console for specific error messages.

