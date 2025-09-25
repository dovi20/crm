import { NextResponse } from "next/server";

 // Minimal mock responses aligned with Rivhit envelope for dev without token
function ok(data: any) {
  const res = NextResponse.json({
    error_code: 0,
    client_message: "",
    debug_message: "",
    data,
  });
  res.headers.set("X-Rivhit-Mode", "mock");
  return res;
}

export function mockResponse(pathSegments: string[], body: any) {
  const path = pathSegments.join("/");

  switch (path) {
    case "Customer.List": {
      const customer_list = [
        {
          customer_id: 64,
          last_name: "ישראלי",
          first_name: "ישראל",
          street: "הרצל 1",
          city: "תל אביב",
          zipcode: "61000",
          phone: "03-5551234",
          fax: "",
          email: "israel@example.com",
          id_number: 123456789,
          vat_number: 123456789,
          customer_type: 1,
          price_list_id: 1,
          agent_id: 0,
          discount_percent: 0,
          acc_ref: "CUST-64",
          comments: "",
        },
        {
          customer_id: 101,
          last_name: "כהן",
          first_name: "שרה",
          street: "דיזנגוף 10",
          city: "תל אביב",
          zipcode: "62000",
          phone: "03-5555678",
          fax: "",
          email: "sara@example.com",
          id_number: 987654321,
          vat_number: 987654321,
          customer_type: 2,
          price_list_id: 1,
          agent_id: 0,
          discount_percent: 5,
          acc_ref: "CUST-101",
          comments: "VIP",
        },
      ];
      return ok({ customer_list });
    }

    case "Item.List": {
      const item_list = [
        {
          item_id: 1001,
          item_name: "חולצה כותנה",
          item_part_num: "SHIRT-CTN",
          barcode: "729000000001",
          item_group_id: 1,
          storage_id: 1,
          quantity: 25,
          cost_nis: 30.0,
          sale_nis: 59.9,
          currency_id: 1,
          cost_mtc: 0,
          sale_mtc: 0,
          picture_link: "",
        },
        {
          item_id: 1002,
          item_name: "מכנסי ג׳ינס",
          item_part_num: "JEANS-STD",
          barcode: "729000000002",
          item_group_id: 1,
          storage_id: 1,
          quantity: 4,
          cost_nis: 80.0,
          sale_nis: 159.9,
          currency_id: 1,
          cost_mtc: 0,
          sale_mtc: 0,
          picture_link: "",
        },
      ];
      return ok({ item_list });
    }

    case "Item.Groups": {
      const item_group_list = [
        { item_group_id: 1, item_group_name: "הלבשה" },
        { item_group_id: 2, item_group_name: "אקססוריז" },
      ];
      return ok({ item_group_list });
    }

    case "Item.StorageList": {
      const storage_list = [
        { storage_id: 1, storage_name: "מחסן ראשי" },
        { storage_id: 2, storage_name: "מחסן משני" },
      ];
      return ok({ storage_list });
    }

    case "Document.TypeList": {
      const document_type_list = [
        { document_type: 1, document_name: "חשבונית מס", is_invoice_receipt: false, is_accounting: true, price_include_vat: true },
        { document_type: 2, document_name: "חשבונית מס קבלה", is_invoice_receipt: true, is_accounting: true, price_include_vat: true },
        { document_type: 4, document_name: "תעודת משלוח", is_invoice_receipt: false, is_accounting: false, price_include_vat: true },
        { document_type: 10, document_name: "הזמנה", is_invoice_receipt: false, is_accounting: false, price_include_vat: true },
      ];
      return ok({ document_type_list });
    }

    case "Document.List": {
      const document_list = [
        {
          document_type: 1,
          document_number: 184,
          document_date: "06/03/2024",
          document_time: "21:06:32",
          amount: 191.14,
          customer_id: 64,
          agent_id: 0,
        },
        {
          document_type: 2,
          document_number: 369,
          document_date: "10/07/2024",
          document_time: "14:22:10",
          amount: 70.0,
          customer_id: 101,
          agent_id: 0,
        },
        {
          document_type: 10,
          document_number: 5021,
          document_date: "01/09/2024",
          document_time: "10:12:05",
          amount: 450.0,
          customer_id: 64,
          agent_id: 0,
        },
        {
          document_type: 10,
          document_number: 5022,
          document_date: "03/09/2024",
          document_time: "16:45:40",
          amount: 1299.0,
          customer_id: 101,
          agent_id: 0,
        },
      ];
      return ok({ document_list });
    }

    case "Document.New": {
      const docType = Number(body?.document_type ?? 10);
      const docNumber = Math.floor(5000 + Math.random() * 5000);
      return ok({
        document_type: docType,
        document_number: docNumber,
        document_identity: "mock-doc-identity-" + docNumber,
        document_link: "https://example.com/mock-doc/" + docNumber,
        print_status: 0,
        customer_id: Number(body?.customer_id ?? 64),
      });
    }

    case "Receipt.TypeList": {
      const receipt_type_list = [
        { receipt_type: 1, receipt_name: "קבלה", is_invoice_receipt: false },
        { receipt_type: 2, receipt_name: "חשבונית מס קבלה", is_invoice_receipt: true },
        { receipt_type: 3, receipt_name: "קבלת דחויים", is_invoice_receipt: false },
      ];
      return ok({ receipt_type_list });
    }

    case "Receipt.List": {
      const receipt_list = [
        {
          receipt_type: 1,
          receipt_number: 353,
          receipt_date: "09/03/2024",
          receipt_time: "21:03:12",
          amount: 1416.0,
          customer_id: 64,
        },
        {
          receipt_type: 1,
          receipt_number: 354,
          receipt_date: "09/03/2024",
          receipt_time: "21:03:40",
          amount: 4212.0,
          customer_id: 101,
        },
      ];
      return ok({ receipt_list });
    }

    case "Accounting.VatRate":
      return ok({ vat_rate: 0.17 });

    case "Currency.List":
      return ok({
        currency_list: [
          { currency_id: 1, currency_name: 'ש"ח', iso_code: "ILS" },
          { currency_id: 2, currency_name: "USD", iso_code: "USD" },
          { currency_id: 3, currency_name: "EURO", iso_code: "EUR" },
        ],
      });

    case "Payment.TypeList":
      return ok({
        payment_type_list: [
          { payment_type: 1, payment_name: "שיק", type_code: 2 },
          { payment_type: 2, payment_name: "מזומן", type_code: 1 },
          { payment_type: 4, payment_name: "ישראכרט", type_code: 3 },
        ],
      });

    case "Payment.BankList":
      return ok({
        bank_list: [
          { bank_code: 10, bank_name: "לאומי" },
          { bank_code: 11, bank_name: "דיסקונט" },
          { bank_code: 12, bank_name: "הפועלים" },
        ],
      });

    default:
      // Unknown path: return NO_DATA_FOUND shape
      {
        const res = NextResponse.json({
          error_code: 204,
          client_message: "NO_DATA_FOUND",
          debug_message: `No mock for ${path}`,
          data: {},
        });
        res.headers.set("X-Rivhit-Mode", "mock");
        return res;
      }
  }
}
