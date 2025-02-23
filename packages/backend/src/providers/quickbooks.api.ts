/**************************************
 * quickbooks.api.ts
 **************************************/
import axios, { AxiosInstance } from "axios";
import * as qs from "querystring";
import { IQuickBooksConfig, IQuickBooksTokens } from "shared/interfaces";
import { QuickBooksTokens } from "../orm/audit/QuickBooksTokens";
import { MongoDataSource } from "../orm/audit/AuditDataSource";
import { ObjectId } from "mongodb";
import { QbTipoInventario } from "shared/enums";

interface IAddress {
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string; // State/Province
  PostalCode?: string;
  Country?: string;
}

interface IEmailAddress {
  Address: string;
}

interface IPhone {
  FreeFormNumber: string;
}

export interface ICustomerData {
  DisplayName: string; // Required, must be unique
  Title?: string;
  GivenName?: string;
  MiddleName?: string;
  FamilyName?: string;
  Suffix?: string;
  PrimaryEmailAddr?: IEmailAddress;
  PrimaryPhone?: IPhone;
  Mobile?: IPhone;
  BillAddr?: IAddress;
  ShipAddr?: IAddress;
  Notes?: string;
  CompanyName?: string;
  Active?: boolean;
  Job?: boolean;
  Balance?: number;
  BalanceWithJobs?: number;
  PreferredDeliveryMethod?: string;
  ResaleNum?: string;
  PrintOnCheckName?: string;
}

interface IItemRef {
  value: string;
  name: string;
}

interface IItemData {
  Name: string;
  Sku: string;
  Type: string;
  UnitPrice: number;
  TrackQtyOnHand: boolean;
  Active: boolean;
  IncomeAccountRef: IItemRef;
  Description?: string;
  PurchaseDesc?: string;
  QtyOnHand?: number;
  InvStartDate?: string;
  AssetAccountRef?: IItemRef;
  ExpenseAccountRef?: IItemRef;
}

/**
 * A class that encapsulates all QuickBooks operations needed.
 */
export class QuickBooksAPI {
  private config: IQuickBooksConfig;
  private tokenStore: IQuickBooksTokens | null = null;

  private axiosClient: AxiosInstance;

  constructor() {
    this.config = {
      clientId: process.env.QUICKBOOKS_CLIENT_ID as string,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET as string,
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI as string,
      realmId: process.env.QUICKBOOKS_REALM_ID as string,
      environment: process.env.QUICKBOOKS_ENVIRONMENT as
        | "sandbox"
        | "production",
    };

    // Set up baseURL depending on environment (sandbox vs production)
    const baseURL =
      this.config.environment === "sandbox"
        ? "https://sandbox-quickbooks.api.intuit.com"
        : "https://quickbooks.api.intuit.com";

    this.axiosClient = axios.create({ baseURL });
  }

  /**
   * Build the OAuth 2.0 authorization URI.
   * You'd redirect your user/admin to this URI to approve the connection.
   */
  public getAuthorizationUri(
    scopes: string[] = ["com.intuit.quickbooks.accounting"]
  ): string {
    const baseAuthUrl = "https://appcenter.intuit.com/connect/oauth2";
    const query = qs.stringify({
      client_id: this.config.clientId,
      scope: scopes.join(" "),
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      state: crypto.randomUUID(),
    });
    return `${baseAuthUrl}?${query}`;
  }

  /**
   * Exchange authorization code for access/refresh tokens.
   * (Called once after the user approves the app on the QuickBooks side.)
   */
  public async exchangeAuthCodeForTokens(
    authCode: string,
    realmId: string
  ): Promise<void> {
    const tokenUrl =
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
    const authHeader = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    try {
      const response = await axios.post(
        tokenUrl,
        qs.stringify({
          grant_type: "authorization_code",
          code: authCode,
          redirect_uri: this.config.redirectUri,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${authHeader}`,
          },
        }
      );

      this.tokenStore = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        refreshTokenExpiresIn: response.data.x_refresh_token_expires_in,
        expiresAt: Date.now() + response.data.expires_in * 1000,
        refreshTokenExpiresAt:
          Date.now() + response.data.x_refresh_token_expires_in * 1000,
      };

      // Store the realmId (company ID) we got from the callback
      this.config.realmId = realmId;

      await this.setTokens(this.tokenStore);

      console.log("QBO tokens acquired successfully");
      console.log("QBO realm ID set to:", this.config.realmId);
    } catch (error: any) {
      console.error(
        "Error exchanging auth code for QBO tokens:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Replace any existing tokens with those retrieved from a DB or from prior sessions.
   * (Useful if the tokens were stored externally).
   */
  public async setTokens(tokens: IQuickBooksTokens): Promise<void> {
    this.tokenStore = tokens;
    const tokenId = new ObjectId(QuickBooksTokens.SINGLETON_ID);
    await MongoDataSource.getMongoRepository(QuickBooksTokens).updateOne(
      { _id: tokenId },
      {
        $set: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
          expiresAt: tokens.expiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        },
      },
      { upsert: true }
    );
  }

  /**
   * Return the currently known tokens (could be null if not set).
   * Typically, you'd store these in a DB after each refresh.
   */
  public async getTokens(): Promise<IQuickBooksTokens | null> {
    try {
      const tokens = await MongoDataSource.getMongoRepository(
        QuickBooksTokens
      ).findOneBy({ _id: new ObjectId(QuickBooksTokens.SINGLETON_ID) });

      if (tokens) {
        this.tokenStore = tokens;
      }

      return tokens;
    } catch (error) {
      console.error("Error getting tokens:", JSON.stringify(error, null, 2));
      return null;
    }
  }

  /**
   * Refresh the access token if needed, or if you detect a 401. (No user interaction needed.)
   */
  public async refreshAccessTokenIfNeeded(): Promise<void> {
    if (!this.tokenStore) {
      throw new Error("No tokens available. Must authenticate first.");
    }

    const now = Date.now();

    // Check if refresh token has expired
    if (now >= this.tokenStore.refreshTokenExpiresAt) {
      throw new Error("Refresh token has expired. Must re-authenticate.");
    }

    // Check if access token has expired or will expire in next 5 minutes
    if (now >= this.tokenStore.expiresAt - 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Force a refresh token call to QBO.
   * This is private because we rarely call it manually—usually from refreshAccessTokenIfNeeded.
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokenStore) {
      throw new Error("No existing tokens to refresh.");
    }

    const tokenUrl =
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
    const authHeader = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    try {
      const response = await axios.post(
        tokenUrl,
        qs.stringify({
          grant_type: "refresh_token",
          refresh_token: this.tokenStore.refreshToken,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${authHeader}`,
          },
        }
      );

      this.tokenStore = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        refreshTokenExpiresIn: response.data.x_refresh_token_expires_in,
        expiresAt: Date.now() + response.data.expires_in * 1000,
        refreshTokenExpiresAt:
          Date.now() + response.data.x_refresh_token_expires_in * 1000,
      };

      this.setTokens(this.tokenStore);

      console.log("Refreshed QBO tokens successfully");
    } catch (error: any) {
      console.error(
        "Error refreshing QBO tokens:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Wrapper for API calls to handle token refresh and retries
   */
  private async makeApiCall<T>(
    apiCall: () => Promise<T>,
    retryCount = 1
  ): Promise<T> {
    try {
      await this.getTokens();
      await this.refreshAccessTokenIfNeeded();
      return await apiCall();
    } catch (error: any) {
      if (error.response?.status === 401 && retryCount > 0) {
        // Force token refresh on 401 and retry once
        await this.refreshAccessToken();
        return this.makeApiCall(apiCall, retryCount - 1);
      }
      throw error;
    }
  }

  /**
   * Find an Item (product/service) by SKU and optional Type.
   * If `type` is provided, filters on that as well.
   * QBO item types: "Inventory", "NonInventory", "Service", "Bundle"
   */
  public async findItemBySkuAndType(
    sku: string,
    type?: string
  ): Promise<any[]> {
    let query = `select * from Item where Sku = '${sku}'`;
    if (type) {
      query += ` and Type = '${type}'`;
    }

    const endpoint = `/v3/company/${
      this.config.realmId
    }/query?query=${encodeURIComponent(query)}&minorversion=65`;

    return this.makeApiCall(async () => {
      const response = await this.axiosClient.get(endpoint, {
        headers: {
          Authorization: `Bearer ${this.tokenStore?.accessToken}`,
          Accept: "application/json",
        },
      });
      return response.data?.QueryResponse?.Item || [];
    });
  }

  /**
   * Find a customer by email address.
   */
  public async findCustomerByEmail(email: string): Promise<any[]> {
    const query = `select * from Customer where PrimaryEmailAddr = '${email}'`;
    const endpoint = `/v3/company/${
      this.config.realmId
    }/query?query=${encodeURIComponent(query)}&minorversion=65`;

    return this.makeApiCall(async () => {
      const response = await this.axiosClient.get(endpoint, {
        headers: {
          Authorization: `Bearer ${this.tokenStore?.accessToken}`,
          Accept: "application/json",
        },
      });
      return response.data?.QueryResponse?.Customer || [];
    });
  }

  /**
   * Create a customer in QuickBooks.
   */
  public async createCustomer(customer: any): Promise<any> {
    const endpoint = `/v3/company/${this.config.realmId}/customer?minorversion=65`;

    return this.makeApiCall(async () => {
      const response = await this.axiosClient.post(endpoint, customer, {
        headers: {
          Authorization: `Bearer ${this.tokenStore?.accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      return response.data?.Customer;
    });
  }

  /**
   * Find a customer by email address.
   * if no customer is found, create a new one.
   */
  public async findOrCreateCustomerByEmail(email: string): Promise<any> {
    const customers = await this.findCustomerByEmail(email);

    if (!customers || customers.length === 0) {
      // Create a more unique display name using timestamp
      const timestamp = new Date().getTime();
      const displayName = `${email.split("@")[0]}_${timestamp}`;

      const customerData: ICustomerData = {
        DisplayName: displayName,
        PrimaryEmailAddr: {
          Address: email,
        },
        GivenName: email.split("@")[0], // Add given name as the part before @
        Active: true,
      };

      try {
        const newCustomer = await this.createCustomer(customerData);
        return newCustomer;
      } catch (error: any) {
        console.error(
          "Error in findOrCreateCustomerByEmail:",
          error.response?.data || error.message
        );
        throw error;
      }
    }

    return customers[0]; // Return the first matching customer
  }

  /**
   * Create an invoice in QuickBooks.
   * For each invoice line, you must reference the QBO Item ID (ItemRef.value).
   */
  public async createInvoice(invoice: any): Promise<any> {
    const endpoint = `/v3/company/${this.config.realmId}/invoice?minorversion=65`;

    return this.makeApiCall(async () => {
      const response = await this.axiosClient.post(endpoint, invoice, {
        headers: {
          Authorization: `Bearer ${this.tokenStore?.accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      return response.data?.Invoice;
    });
  }

  public async getCompanyInfo(): Promise<any> {
    const endpoint = `/v3/company/${this.config.realmId}/companyinfo/${this.config.realmId}?minorversion=65`;

    return this.makeApiCall(async () => {
      const response = await this.axiosClient.get(endpoint, {
        headers: {
          Authorization: `Bearer ${this.tokenStore?.accessToken}`,
          Accept: "application/json",
        },
      });
      return response.data?.CompanyInfo;
    });
  }

  /**
   * Create a product/item in QuickBooks.
   */
  private async createItem(item: {
    name: string;
    sku: string;
    type: string;
    unitPrice: number;
  }): Promise<any> {
    const endpoint = `/v3/company/${this.config.realmId}/item?minorversion=65`;

    // Create a unique name using the SKU
    const uniqueName = item.name.includes("Personalizado")
      ? `Personalizado ${item.sku}`
      : item.name;

    const itemData: IItemData = {
      Name: uniqueName,
      Sku: item.sku,
      Type: item.type,
      UnitPrice: item.unitPrice,
      TrackQtyOnHand: item.type === QbTipoInventario.inventory,
      Active: true,
      IncomeAccountRef: {
        value: "79", // Income account for sales
        name: "Sales of Product Income",
      },
    };

    // Add required fields for inventory items
    if (item.type === QbTipoInventario.inventory) {
      itemData.QtyOnHand = 0;
      itemData.InvStartDate = new Date().toISOString().split("T")[0];
      itemData.AssetAccountRef = {
        value: "81", // Inventory asset account (Other Current Asset type)
        name: "Inventory Asset",
      };
      itemData.ExpenseAccountRef = {
        value: "80", // COGS account
        name: "Cost of Goods Sold",
      };
    }

    console.log(
      "Creating QB item with data:",
      JSON.stringify(itemData, null, 2)
    );

    return this.makeApiCall(async () => {
      const response = await this.axiosClient.post(endpoint, itemData, {
        headers: {
          Authorization: `Bearer ${this.tokenStore?.accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      return response.data?.Item;
    });
  }

  /**
   * Creates a QuickBooks invoice from an Orden.
   * Handles customer lookup/creation, product lookup/creation, and invoice creation.
   */
  public async createInvoiceFromOrden(orden: any): Promise<{
    Id: string;
    DocNumber: string;
  }> {
    try {
      console.log("Creating QB invoice for orden:", orden.id);

      // 1. Find or create customer by vendedor email
      console.log("Finding/creating customer for email:", orden.vendedor.email);
      const customer = await this.findOrCreateCustomerByEmail(
        orden.vendedor.email
      );
      console.log("Found/created customer:", customer.Id);

      // 2. Process all items
      console.log("Processing", orden.items.length, "items");
      const invoiceLines = await Promise.all(
        orden.items.map(async (item: any) => {
          console.log("Processing item:", item.producto.sku);
          // First try to find the item by SKU without type filter
          let qbItems = await this.findItemBySkuAndType(item.producto.sku);
          let qbItem; // Declare the variable
          if (!qbItems || qbItems.length === 0) {
            console.log("Creating new QB item for:", item.producto.sku);
            qbItem = await this.createItem({
              name: item.producto.nombre,
              sku: item.producto.sku,
              type: item.qbTipoInventario || QbTipoInventario.inventory,
              unitPrice: item.precio,
            });
          } else {
            console.log("Found existing QB item:", qbItems[0].Id);
            qbItem = qbItems[0];
          }

          const lineItem = {
            Amount: item.precio * item.cantidad,
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
              ItemRef: {
                value: qbItem.Id,
                name: qbItem.Name,
              },
              Qty: item.cantidad,
              UnitPrice: item.precio,
            },
            Description: item.notas || undefined,
          };
          console.log("Created line item:", JSON.stringify(lineItem, null, 2));
          return lineItem;
        })
      );

      // 4. Create invoice
      const invoiceData = {
        Line: invoiceLines,
        ...(orden.credito > 0 && {
          DiscountAmt: orden.credito,
          ApplyTaxAfterDiscount: true,
        }),
        CustomerRef: {
          value: customer.Id,
        },
        TxnDate: new Date(orden.fechaCreado).toISOString().split("T")[0],
        CustomerMemo: {
          value: `Orden #${orden.serial}\nCliente: ${
            orden.cliente.empresa
              ? orden.cliente.empresa
              : orden.cliente.nombre + " " + orden.cliente.apellido
          }\n${orden.notas || ""}`.trim(),
        },
        CustomField: [
          {
            DefinitionId: "1",
            Name: "Orden ID",
            Type: "StringType",
            StringValue: orden.serial,
          },
        ],
        EmailStatus: "NeedToSend",
        BillEmail: {
          Address: orden.vendedor.email,
        },
      };

      console.log(
        "Sending invoice data to QB:",
        JSON.stringify(invoiceData, null, 2)
      );

      const invoice = await this.createInvoice(invoiceData);
      console.log("Successfully created QB invoice:", invoice.Id);

      // Send the invoice by email
      try {
        await this.sendInvoiceByEmail(invoice.Id);
        console.log("Successfully sent invoice email for:", invoice.Id);
      } catch (error: any) {
        console.error("Error sending invoice email:", error.message);
      }

      return {
        Id: invoice.Id,
        DocNumber: invoice.DocNumber,
      };
    } catch (error: any) {
      console.error(
        "Error creating QB invoice from orden:",
        error.response?.data || error.message
      );
      if (error.response?.data) {
        console.error(
          "Full QB error response:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error;
    }
  }

  /**
   * Send an invoice by email using the BillEmail address
   */
  public async sendInvoiceByEmail(invoiceId: string): Promise<any> {
    const endpoint = `/v3/company/${this.config.realmId}/invoice/${invoiceId}/send`;

    return this.makeApiCall(async () => {
      const response = await this.axiosClient.post(endpoint, null, {
        headers: {
          Authorization: `Bearer ${this.tokenStore?.accessToken}`,
          "Content-Type": "application/octet-stream",
          Accept: "application/json",
        },
      });
      return response.data;
    });
  }
}
