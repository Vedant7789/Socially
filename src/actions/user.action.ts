"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function syncUser(){
    try{
        const {userId}=await auth()
        const user=await currentUser();
        if(!userId || !user)return;

        const existingUser=await prisma.user.findUnique({
            where:{
                clerkId:userId
            }
        })
        if(existingUser) return existingUser;

        const dbUser=await prisma.user.create({
            data:{
                clerkId:userId,
                name:`${user.firstName|| ""} ${user.lastName || ""}`,
                userame:user.username??user.emailAddresses[0].emailAddress.split("@")[0],
                email:user.emailAddresses[0].emailAddress,



            }
        })
        return dbUser;



    }catch(error){

    }
}

export async function getUserByClerkId(clerkId:string){
    return prisma.user.findUnique({
        where:{
            clerkId,
        },
        include:{
            _count:{
                select:{
                    followers:true,
                    following:true,
                    posts:true,
                },
            },
        },

    });
}

export async function getDbUserId(){
    const {userId:clerkId}=await auth();
    if(!clerkId) return null;
    const user=await getUserByClerkId(clerkId);
    if(!user) throw new Error("User not found");
    return user.id
}

export async function getRandomUsers(){
    try{
        const userId=await getDbUserId();
        const randomUsers=await prisma.user.findMany({
            where:{
                AND:[
                    {NOT:{id:userId}},
                    {
                        NOT:{
                            followers:{
                                some:{
                                    followerId:userId
                                }
                            }
                        }
                    }
                ]
            },
            select:{ 
                id:true,
                name:true,
                userame:true,
                image:true,
                _count:{
                    select:{
                        followers:true,

                    },
                   

                }
            },take:3,
        })

        return randomUsers;


    }catch(error){
        console.log("error ",error)
        return[];


    }
}

export async function toggleFollow(targetUserId:string){
  try{
    const userId=await getDbUserId();
    if(userId===targetUserId) throw new Error("you cannot follow yourself");

    const existingFollow=await prisma.follows.findUnique({
        where:{
            followerId_followingId:{
                followerId:userId,
                followingId:targetUserId
            }
        }
    })
    if(existingFollow){
        await prisma.follows.delete({
            where:{
                followerId_followingId:{
                    followerId:userId,
                    followingId:targetUserId
                }
            }
        })
    }else{
        await prisma.$transaction ([
            prisma.follows.create({
                data:{
                    followerId:userId,
                followingId:targetUserId

                }
               
            }),
            prisma.notification.create({
                data:{
                    type:"FOLLOW",
                    userId:targetUserId,
                    creatorId:userId

                }
            })
        ])
    }
    return{success:true}

  }catch(error){
    console.log("error in togglefollow",error);
    return {success:false,error:"error toggling follow"}

  }


}