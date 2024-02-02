const asyncHandler =(reqHandler) =>{
    (req,res,next)=>{
        promise.resolve(reqHandler(req,res,next)).

        catch((err)=>next(err))
    }
}

export {asyncHandler}