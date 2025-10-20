const axios = require("axios");
require("dotenv").config();

const readAllInvoices = "https://api.hubapi.com/crm/v3/objects/invoices";
const readInvoice = "https://api.hubapi.com/crm/v3/objects/invoices/";
const readAllServices = "https://api.hubapi.com/crm/v3/objects/0-162";
const readService = "https://api.hubapi.com/crm/v3/objects/0-162/";
const readCompany = "https://api.hubapi.com/crm/v3/objects/companies/"
const readCompanies = "https://api.hubapi.com/crm/v3/objects/companies"
const readAllDeals = "https://api.hubapi.com/crm/v3/objects/0-3"
const readDeal = "https://api.hubapi.com/crm/v3/objects/0-3/"
const ACCESS_TOKEN = process.env["ACCESS_TOKEN"];

// Master Function
async function handleInvoiceSync(invoiceId) {
  try {
    // Get Invoice info
    const invoice = await getInvoiceData(invoiceId);
    if (!invoice || !invoice.associatedCompany) return;

    // Get Company + associated Services
    const companyData = await getCompany(invoice.associatedCompany);
    const services = companyData.associatedServices;

    // Handle mapping logic
    if (services.length === 1) {
      console.log(`Only one service found — automatically associating...`);
      // here you'd call associateInvoiceWithService(invoice.id, services[0].id)
    } else {
      console.log(`Multiple services found, applying matching logic...`);
      await findMatchingService(invoice, services);
    }
  } catch (error) {
    console.error("Workflow failed:", error.response?.data || error);
  }
}






// 1. Get Invoice/s

async function getInvoiceData(id) {
  try {
    const invoiceResponse = await axios.get(
      `${readInvoice}${id}?properties=hs_number,hs_status&associations=companies`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Invoice Data:", JSON.stringify(invoiceResponse.data, null, 2));

    const associatedCompany =
      invoiceResponse.data.associations?.companies?.results?.[0]?.id;

    if (!associatedCompany) {
      console.log("No associated company found.");
      return null;
    }

    console.log("Associated Company ID:", associatedCompany);
    return associatedCompany;
  } catch (error) {
    console.error("Could not find any invoices:", error.response?.data || error);
  }
}


// 2. Get company information


async function getCompany (id) {
    try {
        const companyResponse = await axios.get(`${readCompany}${id}?associations=services,deals`, {
            headers: {Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
        },
        });

        console.log(JSON.stringify(companyResponse.data, null, 2));

        // For each serviceId, call getServiceData and pass through the serviceId

        for (let i = 0; i < companyResponse.data.associations.services.results.length; i++) {
            const serviceId = companyResponse.data.associations.services.results[i].id;
            console.log(`This is the ${[i]} service`)

            await getServiceData(serviceId)

        }


    } catch (error) {
        console.error("Cannot find company", error);
    }
}

(async () => {
  const companyId = await getInvoiceData("657631502580");
  if (companyId) {
    await getCompany(companyId);
  }
})();




// 3. Get deal information


// async function getDealData (id) {
//     try {
//         const dealResponse = await axios.get(`${readDeal}${id}`, {
//             headers: {
//                 Authorization: `Bearer ${ACCESS_TOKEN}`,
//                 "Content-Type": "application/json" 
//             },
//         });

//         console.log(JSON.stringify(dealResponse.data, null, 2));
//     } catch (error) {
//         console.error("Could not find any deals: ", error);
//     };
// };


async function getServiceData (id) {
    try {
        const serviceResponse = await axios.get(`${readService}${id}`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json" 
            },
        });

        console.log(JSON.stringify(serviceResponse.data, null, 2));
    } catch (error) {
        console.error("Could not find any services: ", error);
    };
};
