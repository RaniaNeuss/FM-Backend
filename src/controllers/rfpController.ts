import { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient'; // Import the Prisma client
import axios from 'axios'; // Ensure this is at the top





export const createFullRfp = async (req: Request, res: Response) => {
  try {
    const {
      typeOfRfp,
      RfpReference,
      startDate,
      completionDate,
      panelMeetingDate,
      panelDecisionDate,
      LocationType,
      generalInfo,
      location,
      flowMeasurement,
      flowMonitoring,
      data,
      maf,
      attachments
    } = req.body

    const rfp = await prisma.rfp.create({
      data: {
        typeOfRfp,
        RfpReference,
        startDate: startDate ? new Date(startDate) : undefined,
        completionDate: completionDate ? new Date(completionDate) : undefined,
        panelMeetingDate: panelMeetingDate ? new Date(panelMeetingDate) : undefined,
        panelDecisionDate: panelDecisionDate ? new Date(panelDecisionDate) : undefined,

        LocationType: {
          create: LocationType
        },
        generalInfo: {
          create: {
            ...generalInfo,
            reportDate: new Date(generalInfo.reportDate)
          }
        },
        location: {
          create: location
        },
        flowMeasurement: {
          create: flowMeasurement
        },
        flowRegister: {
          create: {
            inventory: {
              create: flowMonitoring.inventory
            },
            installation: {
              create: {
                ...flowMonitoring.installation,
                meterInstallDate: new Date(flowMonitoring.installation.meterInstallDate),
                meterRemovalDate: new Date(flowMonitoring.installation.meterRemovalDate)
              }
            },
            maintenance: {
              create: flowMonitoring.maintenance
            }
          }
        },
        data: {
          create: data
        },
        maf: {
          create: maf
        },
        attachments: attachments?.length > 0 ? {
          create: attachments.map((att: any) => ({
            type: att.type,
            filePath: att.filePath,
            uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date()
          }))
        } : undefined
      },
      include: {
        LocationType: true,
        generalInfo: true,
        location: true,
        flowMeasurement: true,
        flowRegister: {
          include: {
            inventory: true,
            installation: true,
            maintenance: true
          }
        },
        data: true,
        maf: true,
        attachments: true
      }
    })

    res.status(201).json(rfp)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}






function buildNestedFilter(flatFilter: Record<string, any>) {
  const nestedFilter: Record<string, any> = {}

  for (const key in flatFilter) {
    const value = flatFilter[key]

    if (key.includes('.')) {
      const parts = key.split('.')
      let current = nestedFilter
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        current[part] = current[part] ?? {}
        current = current[part]
      }
      current[parts[parts.length - 1]] = value
    } else {
      nestedFilter[key] = value
    }
  }

  return nestedFilter
}

export const getFilteredRfps = async (req: Request, res: Response) => {
  try {
    const filters = req.body
    const where = buildNestedFilter(filters)

    const rfps = await prisma.rfp.findMany({
      where,
      include: {
        LocationType: true,
        generalInfo: true,
        location: true,
        flowMeasurement: true,
        flowRegister: {
          include: {
            inventory: true,
            installation: true,
            maintenance: true
          }
        },
        data: true,
        maf: true
      }
    })

    res.status(200).json(rfps)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}



// export const createFullRfp = async (req: Request, res: Response) => {
//   try {
//     const {
//       typeOfRfp,
//       RfpReference,
//       startDate,
//       completionDate,
//       panelMeetingDate,
//       panelDecisionDate,
//       LocationType,
//       generalInfo,
//       location,
//       flowMeasurement,
//       flowMonitoring,
//       data,
//       maf
//     } = req.body

//     const rfp = await prisma.rfp.create({
//       data: {
//         typeOfRfp,
//         RfpReference ,
//         startDate: startDate ? new Date(startDate) : undefined,
//         completionDate: completionDate ? new Date(completionDate) : undefined,
//         panelMeetingDate: panelMeetingDate ? new Date(panelMeetingDate) : undefined,
//         panelDecisionDate: panelDecisionDate ? new Date(panelDecisionDate) : undefined,

//         LocationType: {
//           create: LocationType
//         },
//         generalInfo: {
//           create: generalInfo
//         },
//         location: {
//           create: location
//         },
//         flowMeasurement: {
//           create: flowMeasurement
//         },
//         flowRegister: {
//           create: {
//             inventory: {
//               create: flowMonitoring.inventory
//             },
//             installation: {
//               create: {
//                 ...flowMonitoring.installation,
//                 meterInstallDate: new Date(flowMonitoring.installation.meterInstallDate),
//                 meterRemovalDate: new Date(flowMonitoring.installation.meterRemovalDate)
//               }
//             },
//             maintenance: {
//               create: flowMonitoring.maintenance
//             }
//           }
//         },
//         data: {
//           create: data
//         },
//         maf: {
//           create: maf
//         }
//       },
//       include: {
//         LocationType: true,
//         generalInfo: true,
//         location: true,
//         flowMeasurement: true,
//         flowRegister: {
//           include: {
//             inventory: true,
//             installation: true,
//             maintenance: true
//           }
//         },
//         data: true,
//         maf: true
//       }
//     })

//     res.status(201).json(rfp)
//   } catch (err: any) {
//     res.status(500).json({ error: err.message })
//   }
// }




// export const getFilteredRfps = async (req: Request, res: Response) => {
//   try {
//     const {
//       typeOfRfp,
//       reference,
//       region,
//       stpcc,
//       inletToTreatment,
//       reportDateFrom,
//       reportDateTo,
//       inventoryMake
//     } = req.body

//     const rfps = await prisma.rfp.findMany({
//       where: {
//         typeOfRfp: typeOfRfp || undefined,
//         reference: reference || undefined,

//         location: region || stpcc ? {
//           region: region || undefined,
//           stpcc: stpcc || undefined
//         } : undefined,

//         compliance: inletToTreatment !== undefined ? {
//           inletToTreatment: inletToTreatment
//         } : undefined,

//         generalInfo: reportDateFrom || reportDateTo ? {
//           reportDate: {
//             gte: reportDateFrom ? new Date(reportDateFrom) : undefined,
//             lte: reportDateTo ? new Date(reportDateTo) : undefined
//           }
//         } : undefined,

//         flowRegister: inventoryMake ? {
//           inventory: {
//             is: {
//               make: inventoryMake
//             }
//           }
//         } : undefined
//       },
//       include: {
//         compliance: true,
//         generalInfo: true,
//         location: true,
//         flowMeasurement: true,
//         flowRegister: {
//           include: {
//             inventory: true,
//             installation: true,
//             maintenance: true
//           }
//         },
//         data: true,
//         maf: true
//       }
//     })

//     res.status(200).json(rfps)
//   } catch (err: any) {
//     res.status(500).json({ error: err.message })
//   }
// }
