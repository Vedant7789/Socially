"use client"

import { toggleFollow } from "@/actions/user.action";
import {useState} from "react";
import toast from "react-hot-toast";
function FollowButton({userId}:{userId:string}){
    const [isLoading,setIsLoading]=useState(false);

    const handleFlow=async()=>{
        setIsLoading(true);
        try{
            await toggleFollow(userId)
            toast.success("user followed successfully");
        }catch(error){
            toast.error("error following user");
        }finally{
            setIsLoading(false);
        }
    }
    return(
        <div>FollowButton</div>
    )
}

export default FollowButton;