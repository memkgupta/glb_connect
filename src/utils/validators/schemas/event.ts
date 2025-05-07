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
        isElimination:z.boolean()

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
    start:z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => new Date(val)),
    end:z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => new Date(val)),
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
export const eventCreationBasicDetailsSchema = z.object({
    title:z.string().min(20).max(200),
    description:z.string().min(100).max(2000),
    venue:z.string(),
    participantsFromOutsideAllowed:z.boolean(),
    startDate:z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => new Date(val)),
    endDate:z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => new Date(val)),
    isOnline:z.boolean(),
    isTeamEvent:z.boolean(),
    category:z.union([z.enum(["entreprenurship","technical","cultural","social"]),z.string()]),
    isFree:z.boolean(),
    maxParticipants:z.number().optional(),
    registrationDeadline:z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => new Date(val)),
    multipleRounds:z.boolean()
})
// step3
export const eventCreationEventStructureSchema = z.object({
    eligibility:z.string(),
    teamRequirements:teamSchema.optional(),
    roundsDetails:roundsSchema.array().optional(),
    speakers:guestSchema.array().optional(),
    timeline:timeLineSchema.array().optional(),
    judges:guestSchema.array().optional(),
    mentors:guestSchema.array().optional(),
    guests:guestSchema.array().optional()
})
//step4
export const eventCreationMonetoryDetailsSchema = z.object({
 
    ticketDetails:ticketingSchema.optional(),
    prizes:prizeSchema.array().optional(),
    sponsors:sponsorsSchema.array().optional(),
})
//step 5
export const eventCreationOrganiserDetailsSchema = z.object({
    organisers:organiserSchema.array(),
    guidelines:guidelineSchema.array(),
})

// complete event schema
export const eventCreationSchema = z.object({
    type:z.enum(["hackathon","session","workshop","contest","campaign","other","ground-work"]),
    basicDetails:eventCreationBasicDetailsSchema,
    eventStructure:eventCreationEventStructureSchema,
    monetaryDetails:eventCreationMonetoryDetailsSchema,
    organiserDetails:eventCreationOrganiserDetailsSchema
});