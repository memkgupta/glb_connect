import {z} from 'zod';
const teamSchema = z.object({
    minimumStrength:z.number(),
    diffCollegeTeamMembersAllowed:z.boolean(),
    otherCriterias:z.string().array(),
});
const roundsSchema = z.object({
  

        title:z.string(),
        description:z.string(),
        isOnline:z.boolean(),
        isElimination:z.boolean().optional()

});
const ticketingSchema = z.object({
    tickets:z.object(
        {
            title:z.string(),
            price:z.number(),
            description:z.string(),
        }
    ).array(),
    description:z.string().optional()
});
const timeLineSchema = z.object({
    start:z.date(),
    end:z.date(),
    description:z.string()
})
const prizeSchema = z.object({
    title:z.string(),
    description:z.string(),
    type:z.enum(["cash","swags","voucher","goods"]),
})
const guestSchema = z.object({
    name:z.string(),
    image:z.string(),
    about:z.string(),
 
});
const sponsorsSchema = z.object({
 
 
    name:z.string().min(10),
    description:z.string().min(10),
    level:z.number(),
    logo:z.string().min(10),
  

})
const organiserSchema = z.object({
    name:z.string(),
    level:z.number(),
    position:z.string(),
    image:z.string()
})
const guidelineSchema = z.object({
    title:z.string(),
    description:z.string(),

})
//step 1

// step 2
export const eventEditBasicDetailsSchema = z.object({
    title:z.string().min(20).max(200).optional(),
    description:z.string().min(100).max(2000).optional(),
    venue:z.string().optional(),
    participantsFromOutsideAllowed:z.boolean().optional(),
    startDate:z.date().optional(),
    endDate:z.date().optional(),
    isOnline:z.boolean().optional(),
    isTeamEvent:z.boolean().optional(),
    category:z.union([z.enum(["entreprenurship","technical","cultural","social"]),z.string()]).optional(),
    isFree:z.boolean().optional(),
    maxParticipants:z.number().optional(),
    registrationDeadline:z.date().optional(),
    multipleRounds:z.boolean().optional()
})
// step3
export const eventEditEventStructureSchema = z.object({
    eligibility:z.string().optional(),
    teamRequirements:teamSchema.optional(),
    roundsDetails:roundsSchema.array().optional(),
    speakers:guestSchema.array().optional(),
    timeline:timeLineSchema.array().optional(),
    judges:guestSchema.array().optional(),
    mentors:guestSchema.array().optional(),
    guests:guestSchema.array().optional()
})
//step4
export const eventEditMonetoryDetailsSchema = z.object({
 
    ticketDetails:ticketingSchema.optional(),
    prizes:prizeSchema.array().optional(),
    sponsors:sponsorsSchema.array().optional(),
})
//step 5
export const eventEditOrganiserDetailsSchema = z.object({
    organisers:organiserSchema.array().optional(),
    guidelines:guidelineSchema.array().optional(),
})