import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function utcDate(offsetDays: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
}

async function main() {
  await prisma.complianceRecord.deleteMany();
  await prisma.employee.deleteMany();

  const alice = await prisma.employee.create({
    data: {
      fullName: 'Alice Chen',
      email: 'alice.chen@abccompany.example',
      department: 'engineering',
    },
  });
  const bob = await prisma.employee.create({
    data: {
      fullName: 'Bob Mensah',
      email: 'bob.mensah@abccompany.example',
      department: 'hr',
    },
  });
  const priya = await prisma.employee.create({
    data: {
      fullName: 'Priya Shah',
      email: 'priya.shah@abccompany.example',
      department: 'finance',
    },
  });
  const diego = await prisma.employee.create({
    data: {
      fullName: 'Diego Alvarez',
      email: 'diego.alvarez@abccompany.example',
      department: 'operations',
    },
  });
  const elena = await prisma.employee.create({
    data: {
      fullName: 'Elena Rossi',
      email: 'elena.rossi@abccompany.example',
      department: 'legal',
    },
  });

  await prisma.complianceRecord.createMany({
    data: [
      {
        employeeId: alice.id,
        type: 'visa',
        issuedDate: utcDate(-200),
        expiryDate: utcDate(90),
        status: 'active',
        notes: 'H-1B currently valid',
      },
      {
        employeeId: alice.id,
        type: 'certification',
        issuedDate: utcDate(-350),
        expiryDate: utcDate(12),
        status: 'active',
        notes: 'AWS Solutions Architect — renewal window',
      },
      {
        employeeId: bob.id,
        type: 'background_check',
        issuedDate: utcDate(-400),
        expiryDate: utcDate(-8),
        status: 'active',
        notes: 'Background check past validity',
      },
      {
        employeeId: bob.id,
        type: 'training',
        issuedDate: utcDate(-80),
        expiryDate: utcDate(10),
        status: 'expiring',
        notes: 'Security awareness due this month',
      },
      {
        employeeId: priya.id,
        type: 'visa',
        issuedDate: utcDate(-700),
        expiryDate: utcDate(-5),
        status: 'expired',
        notes: 'Work permit lapsed',
      },
      {
        employeeId: priya.id,
        type: 'certification',
        issuedDate: utcDate(-20),
        expiryDate: utcDate(180),
        status: 'renewed',
        notes: 'CPA license renewed last month',
        documentUrl: 'https://files.example/priya-cpa.pdf',
      },
      {
        employeeId: diego.id,
        type: 'training',
        issuedDate: utcDate(-40),
        expiryDate: utcDate(60),
        status: 'active',
        notes: 'Forklift recertification',
      },
      {
        employeeId: elena.id,
        type: 'visa',
        issuedDate: utcDate(-300),
        expiryDate: utcDate(20),
        status: 'expiring',
        notes: 'Residence permit window',
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
