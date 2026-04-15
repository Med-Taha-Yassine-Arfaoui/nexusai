-- CreateTable
CREATE TABLE "MarketData" (
    "id" SERIAL NOT NULL,
    "codeisin" TEXT,
    "mnemo" TEXT,
    "last_trade_price" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION,
    "var_prev_close" DOUBLE PRECISION,
    "time" TIMESTAMP(3),
    "ingested_at" TIMESTAMP(3),

    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);
