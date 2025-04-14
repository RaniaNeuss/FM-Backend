import { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient'; // Import the Prisma client
import axios from 'axios'; // Ensure this is at the top








export const createFullRfp = async (req: Request, res: Response) => {
  try {
    const {
      typeOfRfp,
      reference,
      startDate,
      completionDate,
      panelMeetingDate,
      panelDecisionDate,
      compliance,
      generalInfo,
      location,
      flowMeasurement,
      flowMonitoring,
      data,
      maf
    } = req.body

    const rfp = await prisma.rfp.create({
      data: {
        typeOfRfp,
        reference,
        startDate: startDate ? new Date(startDate) : undefined,
        completionDate: completionDate ? new Date(completionDate) : undefined,
        panelMeetingDate: panelMeetingDate ? new Date(panelMeetingDate) : undefined,
        panelDecisionDate: panelDecisionDate ? new Date(panelDecisionDate) : undefined,

        compliance: {
          create: compliance
        },
        generalInfo: {
          create: generalInfo
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
        }
      },
      include: {
        compliance: true,
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

    res.status(201).json(rfp)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}




export const getFilteredRfps = async (req: Request, res: Response) => {
  try {
    const {
      typeOfRfp,
      reference,
      region,
      stpcc,
      inletToTreatment,
      reportDateFrom,
      reportDateTo,
      inventoryMake
    } = req.body

    const rfps = await prisma.rfp.findMany({
      where: {
        typeOfRfp: typeOfRfp || undefined,
        reference: reference || undefined,

        location: region || stpcc ? {
          region: region || undefined,
          stpcc: stpcc || undefined
        } : undefined,

        compliance: inletToTreatment !== undefined ? {
          inletToTreatment: inletToTreatment
        } : undefined,

        generalInfo: reportDateFrom || reportDateTo ? {
          reportDate: {
            gte: reportDateFrom ? new Date(reportDateFrom) : undefined,
            lte: reportDateTo ? new Date(reportDateTo) : undefined
          }
        } : undefined,

        flowRegister: inventoryMake ? {
          inventory: {
            is: {
              make: inventoryMake
            }
          }
        } : undefined
      },
      include: {
        compliance: true,
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