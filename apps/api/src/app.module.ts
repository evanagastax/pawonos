import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { IngredientsModule } from "./modules/ingredients/ingredients.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { PackagingModule } from "./modules/packaging/packaging.module";
import { RecipesModule } from "./modules/recipes/recipes.module";
import { MenuItemsModule } from "./modules/menu-items/menu-items.module";
import { MealTemplatesModule } from "./modules/meal-templates/meal-templates.module";
import { MealCalendarModule } from "./modules/meal-calendar/meal-calendar.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { ProductionModule } from "./modules/production/production.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { PurchasingModule } from "./modules/purchasing/purchasing.module";
import { CostEngineModule } from "./modules/cost-engine/cost-engine.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { EmployeesModule } from "./modules/employees/employees.module";
import { PayrollModule } from "./modules/payroll/payroll.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { singleLine: true } }
            : undefined,
      },
    }),
    PrismaModule,
    AuthModule,
    IngredientsModule,
    SuppliersModule,
    PackagingModule,
    RecipesModule,
    MenuItemsModule,
    MealTemplatesModule,
    MealCalendarModule,
    CustomersModule,
    OrdersModule,
    ProductionModule,
    InventoryModule,
    PurchasingModule,
    CostEngineModule,
    FinanceModule,
    InvoicesModule,
    EmployeesModule,
    PayrollModule,
  ],
})
export class AppModule {}