import dotenv from "dotenv";
import connectDB from "./DB/index.js";
import {app} from './app.js'

dotenv.config({
    path:'./.env' // path check end me
})

connectDB()
.then( () =>  {
    app.listen(process.env.PORT||8000,() => {
        console.log(`server is running at port ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("mongo ERROR failed",error);
})

/*"email" :"billu@gmail.com",
    "password":"123456"

    "email" :"here@gmail.com",
    "password":"1234567"

    


    */
















// import express from "express"
// const app = express()

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error) => {
//             console.log("ERR: ",error);
//             throw error
//         })

//         app.listen(process.env.PORT, ()=> {
//             console.log(`app is listening on port ${process.env.PORT}`);
            
//         })

//     } catch (error) {
//         console.error("ERROR",error)
//         throw error
//     }
// } )()