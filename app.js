import express from "express";
import { db } from "./config.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { readFile } from "fs/promises";
import admin from "firebase-admin";
import cors from "cors";
import jwt from "jsonwebtoken";
import { resolve } from "path";

const port = process.env.port || 3000;
const app = express();
const json = JSON.parse(
  await readFile(
    new URL(
      "./mdrive-e7b27-firebase-adminsdk-nuzyx-ebe37b3698.json",
      import.meta.url
    )
  )
);

app.use(express.json());
app.use(cors());
admin.initializeApp({
  credential: admin.credential.cert(json),
});

/* AUTH */
app.post("/signin", (req, res) => {
  const auth = getAuth();
  const { email, password } = req.body;
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      const token = user.stsTokenManager.accessToken;
      res.json({ Message: "Success", token, _id: user.uid });

      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      res.json({ Message: "Error", errorCode, errorMessage });
    });
});

app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const response = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: false,
    });
    req.body.role = "user";
    const fire = await addDoc(collection(db, "users"), req.body);
    const UserID = fire.id;
    // ...
    res.json({ Message: "Success", response, UserID });
  } catch (error) {
    res.json({ Message: "Catch Error", error });
  }
});
/* End AUTH */

/* StoreFIle */
app.post("/addfile", async (req, res) => {
  try {
    const filedata = await addDoc(collection(db, "myfiles"), req.body);
    res.json({ message: "File Added Successfully", filedata });
  } catch (error) {
    res.json({ Message: `Catch Error`, error });
  }
});
app.post("/addfile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    req.body.folderFile = id;
    const filedata = await addDoc(collection(db, "myfiles"), req.body);
    res.json({ message: "File Added Successfully", filedata });
  } catch (error) {
    res.json({ Message: `Catch Error`, error });
  }
});

app.post("/getfiles", (req, res) => {
  const { token } = req.body;
  const decoded = jwt.decode(token);
  if (token) {
    const q = query(collection(db, "myfiles"));
    getDocs(q)
      .then((snapshot) => {
        let data = [];
        snapshot.docs.forEach((doc) => {
          if (doc.data().userId == decoded.user_id)
            data.push({ ...doc.data(), _id: doc.id });
        });
        res.json({ data });
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  } else {
    // User is signed out
    console.log(`This id Doesn't Exist`);
  }
});

app.post("/folderFiles/:id", async (req, res) => {
  const { token } = req.body;
  const decoded = jwt.decode(token);
  const { id } = req.params;
  if (id) {
    const q = query(collection(db, "myfiles"));
    getDocs(q)
      .then((snapshot) => {
        let data = [];
        snapshot.docs.forEach((doc) => {
          if (
            (doc.data().folderFile == id &&
              doc.data().userId == decoded.user_id) ||
            (doc.data().folderFile == id &&
              doc.data().userId == "Tzlm7xDtiTcgG5AI7R8JpsDGSKe2")
          )
            data.push({ ...doc.data(), _id: doc.id });
        });
        res.json({ data });
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  } else {
    // User is signed out
    console.log(`This id Doesn't Exist`);
  }
});

app.delete("/delFile", async (req, res) => {
  const { id } = req.body;
  await deleteDoc(doc(db, "myfiles", id));
  res.status(201).json({ Msg: "Deleted" });
});

/* End StoreFIle */

/* Add Folder */
app.post("/subfolder/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, depart, token } = req.body;
    const decoded = jwt.decode(token);
    let role;
    const q = query(
      collection(db, "users"),
      where("email", "==", decoded.email)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      role = doc.data().role;
    });
    if (!depart) {
      req.body.depart = "General";
    }
    const docRef = await addDoc(collection(db, "Folders"), {
      title: title,
      depart: depart || req.body.depart,
      createdBy: role,
      userID: decoded.user_id,
      parentFolder:id
    });
    res.status(200).json({ MSG: "Done", docRef });
  } catch (error) {
    res.json({ Message: `Catch Error`, error });
  }
});
app.post("/subFolders/:id", async (req, res) => {
  const { token } = req.body;
  const decoded = jwt.decode(token);
  const { id } = req.params;
  if (id) {
    const q = query(collection(db, "Folders"));
    getDocs(q)
      .then((snapshot) => {
        let data = [];
        snapshot.docs.forEach((doc) => {
          if (
            (doc.data().parentFolder == id &&
              doc.data().userID == decoded.user_id) ||
            (doc.data().parentFolder == id &&
              doc.data().userID == "Tzlm7xDtiTcgG5AI7R8JpsDGSKe2")
          )
            data.push({ ...doc.data(), _id: doc.id });
        });
        res.json({ data });
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  } else {
    // User is signed out
    console.log(`This id Doesn't Exist`);
  }
});
app.post("/addFolder", async (req, res) => {
  const { title, depart, token } = req.body;
  const decoded = jwt.decode(token);
  let role;
  const q = query(collection(db, "users"), where("email", "==", decoded.email));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    role = doc.data().role;
  });
  if (!depart) {
    req.body.depart = "General";
  }
  const docRef = await addDoc(collection(db, "Folders"), {
    title: title,
    depart: depart || req.body.depart,
    createdBy: role,
    userID: decoded.user_id,
  });
  res.status(200).json({ MSG: "Done", docRef });
});
app.post("/Folders", async (req, res) => {
  const { token } = req.body;
  const decoded = jwt.decode(token);
  const querySnapshot = await getDocs(collection(db, "Folders"));
  let data = [];
  querySnapshot.forEach((doc) => {
    if ((doc.data().createdBy == "admin" || doc.data().userID == decoded.user_id) && !doc.data().parentFolder)
      data.push({ ...doc.data(), _id: doc.id });
  });
  res.status(200).json({ MSG: "Done", data });
});

app.delete("/delFolder", async (req, res) => {
  const { id } = req.body;
  await deleteDoc(doc(db, "Folders", id));
  res.status(201).json({ Msg: "Deleted" });
});

app.post("/fav", async (req, res) => {
  try {
    const filedata = await addDoc(collection(db, "favourits"), req.body);
    res.json({ message: "File Added Successfully", filedata });
  } catch (error) {
    res.json({ Message: `Catch Error`, error });
  }
});
app.delete("/remove", async (req, res) => {
  const { id } = req.body;
  console.log(id);
  await deleteDoc(doc(db, "favourits", id));
  res.status(201).json({ Msg: "Deleted" });
});
app.post("/getfav", (req, res) => {
  const { token } = req.body;
  const decoded = jwt.decode(token);
  if (token) {
    const q = query(collection(db, "favourits"));
    getDocs(q)
      .then((snapshot) => {
        let data = [];
        let favID = ''
        snapshot.docs.forEach((doc) => {
          if (doc.data().userId == decoded.user_id)
          {
            favID = doc.id
            data.push({ ...doc.data(),favID });
          }
             
        });
        res.json({ data });
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  } else {
    // User is signed out
    console.log(`This id Doesn't Exist`);
  }
});

/* ENd Folder */

app.listen(port, () => {
  console.log("Server Is Running on port:", port);
});
