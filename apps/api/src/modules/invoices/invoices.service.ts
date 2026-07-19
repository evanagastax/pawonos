import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { status?: string; orderId?: string; page?: number; pageSize?: number }) {
    const { status, orderId, page = 1, pageSize = 50 } = params || {};
    const where: any = {};
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          order: { include: { customer: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        order: { include: { customer: true, items: { include: { menuItem: true } } } },
      },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  async create(orderId: string, dueDate: string, notes?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    // Check if invoice already exists
    const existing = await this.prisma.invoice.findFirst({ where: { orderId } });
    if (existing) throw new BadRequestException("Invoice already exists for this order");

    const invoiceNumber = this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        amount: order.sellingPrice * order.quantity,
        dueDate: new Date(dueDate),
        notes,
        status: "PENDING",
      },
      include: { order: { include: { customer: true } } },
    });
  }

  async updateStatus(id: string, status: string) {
    const invoice = await this.findOne(id);
    const validTransitions: Record<string, string[]> = {
      PENDING: ["SENT", "CANCELLED"],
      SENT: ["PAID", "OVERDUE", "CANCELLED"],
      OVERDUE: ["PAID", "CANCELLED"],
    };
    if (!validTransitions[invoice.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${invoice.status} to ${status}`);
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: status as any },
      include: { order: { include: { customer: true } } },
    });
  }

  async recordPayment(invoiceId: string, amount: number, paymentMethod: string, reference?: string) {
    const invoice = await this.findOne(invoiceId);
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      throw new BadRequestException("Invoice is already paid or cancelled");
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        orderId: invoice.orderId,
        amount,
        paymentMethod,
        reference,
        paymentDate: new Date(),
      },
    });

    // Update invoice status
    const totalPaid = await this.prisma.payment.aggregate({
      where: { orderId: invoice.orderId },
      _sum: { amount: true },
    });

    const paidAmount = (totalPaid._sum.amount || 0);
    let newStatus: string = invoice.status;
    if (paidAmount >= invoice.amount) {
      newStatus = "PAID";
    } else if (paidAmount > 0) {
      newStatus = "SENT"; // Partially paid
    }

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus as any },
    });

    // Update order payment status
    let orderPaymentStatus = "PENDING";
    if (paidAmount >= invoice.amount) {
      orderPaymentStatus = "PAID";
    } else if (paidAmount > 0) {
      orderPaymentStatus = "PARTIAL";
    }

    await this.prisma.order.update({
      where: { id: invoice.orderId },
      data: { paymentStatus: orderPaymentStatus as any },
    });

    return { payment, invoice: await this.findOne(invoiceId) };
  }

  async getOverdue() {
    return this.prisma.invoice.findMany({
      where: {
        status: "SENT",
        dueDate: { lt: new Date() },
      },
      include: { order: { include: { customer: true } } },
    });
  }

  async getSummary() {
    const [pending, sent, paid, overdue] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { status: "PENDING" }, _sum: { amount: true }, _count: true }),
      this.prisma.invoice.aggregate({ where: { status: "SENT" }, _sum: { amount: true }, _count: true }),
      this.prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
      this.prisma.invoice.findMany({
        where: { status: "SENT", dueDate: { lt: new Date() } },
        include: { order: { include: { customer: true } } },
      }),
    ]);

    return {
      pending: { count: pending._count, amount: pending._sum.amount || 0 },
      sent: { count: sent._count, amount: sent._sum.amount || 0 },
      paid: { count: paid._count, amount: paid._sum.amount || 0 },
      overdue: { count: overdue.length, invoices: overdue },
    };
  }

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `INV${year}${month}${random}`;
  }
}