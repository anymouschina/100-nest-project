import { PrismaClient, Prisma } from '@prisma/client'

// 扩展Prisma客户端类型，确保所有表都可以访问
declare global {
  namespace PrismaClient {
    interface PrismaExtends {
      // 聊天模块相关表
      chatAgent: any;
      chatSession: any;
      chatSessionMessage: any;
      semanticIntent: any;
      embeddingCache: any;

      // 原有表
      user: any;
      product: any;
      cart: any;
      cartItem: any;
      order: any;
      orderItem: any;
      coupon: any;
      couponOrderUser: any;
      appointment: any;
      userReferral: any;
      referralCode: any;
    }
  }
}

declare module '@prisma/client' {
  // 为 Unsupported 类型的 vector 定义类型
  interface SemanticIntentCreateInput extends Prisma.SemanticIntentCreateInput {
    embedding?: number[];
  }

  interface SemanticIntentUncheckedCreateInput extends Prisma.SemanticIntentUncheckedCreateInput {
    embedding?: number[];
  }

  interface EmbeddingCacheCreateInput extends Prisma.EmbeddingCacheCreateInput {
    embedding: number[];
  }

  interface EmbeddingCacheUncheckedCreateInput extends Prisma.EmbeddingCacheUncheckedCreateInput {
    embedding: number[];
  }

  interface PrismaClient {
    // 聊天模块相关表
    chatAgent: Prisma.ChatAgentDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    chatSession: Prisma.ChatSessionDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    chatSessionMessage: Prisma.ChatSessionMessageDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    semanticIntent: Prisma.SemanticIntentDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    embeddingCache: Prisma.EmbeddingCacheDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
  }
}

// 扩展DatabaseService
declare module '../database/database.service' {
  interface DatabaseService {
    // 聊天模块相关表
    chatAgent: Prisma.ChatAgentDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    chatSession: Prisma.ChatSessionDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    chatSessionMessage: Prisma.ChatSessionMessageDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    semanticIntent: Prisma.SemanticIntentDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    embeddingCache: Prisma.EmbeddingCacheDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
  }
}

export {}; 