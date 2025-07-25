const asynchandler = (requesthandler) => {
   return (req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next)).catch((Error)=>next(Error))
    }
    
}

export {asynchandler};