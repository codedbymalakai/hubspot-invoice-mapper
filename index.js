const axios = require("axios");
require("dotenv").config();

const readAllInvoices = "https://api.hubapi.com/crm/v3/objects/invoices";
const readInvoice = "https://api.hubapi.com/crm/v3/objects/invoices/";
const readAllServices = "https://api.hubapi.com/crm/v3/objects/0-162";
const readService = "https://api.hubapi.com/crm/v3/objects/0-162/";
const readCompany = "https://api.hubapi.com/crm/v3/objects/companies/"
const readAllDeals = "https://api.hubapi.com/crm/v3/objects/0-3"
const readDeal = "https://api.hubapi.com/crm/v3/objects/0-3/"
const ACCESS_TOKEN = process.env["ACCESS_TOKEN"];

// Main Function
async function handleInvoiceSync(invoiceId) {
  try {
    // Get Company id
    const associatedCompanyID = await getInvoiceData(invoiceId);
    if (!associatedCompanyID) return;

    // Get Company + associated Services
    const companyData = await getCompany(associatedCompanyID);
    const servicesArray = companyData?.data?.associations?.services?.results || [];
    if (servicesArray.length === 0) return;


    console.log("This is the services Array ", servicesArray);

    // Handle mapping logic
    if (servicesArray.length === 1) {
      console.log(`Only one service found - automatically associating...`);
      const serviceId = servicesArray[0].id;
      console.log(serviceId);
      const dealId = await getServiceData(serviceId);
      await associateInvoiceWithDeal(invoiceId, dealId);
    } else {
      console.log(`Multiple services found, applying matching logic...`);
      await findMatchingService(invoiceId, servicesArray);
    }
  } catch (error) {
    console.error("Workflow failed:", error.response?.data || error.message);
  }
  
}




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


    // What if multiple company ids
    const associatedCompanyID =
      invoiceResponse.data.associations?.companies?.results?.[0]?.id;

    if (!associatedCompanyID) {
      console.log("No associated company found.");
      return null;
    }

    console.log("Associated Company ID:", associatedCompanyID);
    return associatedCompanyID;
  } catch (error) {
    console.error("Could not find any invoices:", error.response?.data || error);
  }
}


async function getCompany (id) {
    try {
        const companyResponse = await axios.get(`${readCompany}${id}?associations=services,deals`, {
            headers: {Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
        },
        });

        console.log(JSON.stringify(companyResponse.data, null, 2));
        return companyResponse;


    } catch (error) {
        console.error("Cannot find company", error);
    }
}


async function getServiceData (id) {
    try {
        const serviceResponse = await axios.get(`${readService}${id}?associations=deals`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json" 
            },
        });

        // What if multiple deals
        console.log(JSON.stringify(serviceResponse.data, null, 2));
        return serviceResponse.data.associations?.deals?.results?.[0]?.id;
    } catch (error) {
        console.error("Could not find any services: ", error);
    };
};


async function associateInvoiceWithDeal (invoiceId, dealId) {

  async function getAssociationType () {
    try {

      const typeResponse = await axios.get(`https://api.hubapi.com/crm/v4/associations/invoice/deal/labels`, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
      });

      return typeResponse.data.results[0]?.typeId;

    } catch (error) {
      console.error("Type not found", error.message);
    }
  }

  const typeId = await getAssociationType();

  const assoResponse = await axios.put(
    `https://api.hubapi.com/crm/v3/objects/invoices/${invoiceId}/associations/deals/${dealId}/${typeId}`, 
    {},
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json" 
      },
    })

  console.log(JSON.stringify(assoResponse.data, null, 2))
};

async function findMatchingService (invoiceId, servicesArray) {
  try {
    console.log("Functionality to match service to invoice");
  } catch (error) {
    console.error("Error matching invoice to service.")
  }
}


handleInvoiceSync("657631502580");
