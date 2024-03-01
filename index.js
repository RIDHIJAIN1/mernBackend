import  express  from "express";
import path from 'path';
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { error } from "console";
import jwt from "jsonwebtoken";
import bcypt from "bcrypt"

const handleError = (error) => console.log(error);

// export const connectDatabase = async () => {

  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/backend');
    console.log("connection built")
  } catch (error) {
    handleError(error);
    console.log(error)
  }
// };

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
})
 
const User = mongoose.model("User", userSchema)
const app = express();


// Using middlewares
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
// console.log(path.join(path.resolve(),"public"));


// Setting up view engine
app.set("view engine" , "ejs")

const isAuthenticated = async(req,res , next)=>{
    const {token} = req.cookies;
    if(token){

      const decoded=  jwt.verify(token , "secret123")
      req.user = await User.findById(decoded._id)
      console.log(decoded);
      next()
    }
    else{
        res.render("login")
    }
}


app.get("/",isAuthenticated,(req,res)=>{
res.render("logout", {name:req.user.name})
})


app.get("/success",(req,res)=>{
    res.render("success")
});
app.get("/login",(req,res)=>{
    res.render("login")
});
app.get("/register",(req,res)=>{
    res.render("register")
});

app.post("/login",async(req,res)=>{
    const {email,password} = req.body;

  let user = await User.findOne({email})

  if(!user) return res.redirect("/register")

  const isMatch = await bcypt.compare(password, user.password);

  if(!isMatch ) return res.render("login", {email ,message:"Incorrect Password"});

  const token = jwt.sign({_id:user._id},"secret123");
  // console.log(token)

  res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
  });
  res.redirect("/");

});


app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    let user = await User.findOne({email})
    if(user) {
        return res.redirect("/login")
    }

    const hashedPassword = await bcypt.hash(password,10)

     user = await User.create({ name: name, email: email,password:hashedPassword });
    
    const token = jwt.sign({_id:user._id},"secret123");
    // console.log(token)
  
    res.cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    });
    res.redirect("/");
});

app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
      
      expires: new Date(Date.now()),        
      httpOnly:true,
    })
   
    res.redirect("/")
})



app.listen(5000, ()=>{
    console.log("Server is running")
})

