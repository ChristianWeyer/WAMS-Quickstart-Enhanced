using Microsoft.ServiceBus.Messaging;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TODOsDeviceMonitor
{
    public partial class MainForm : Form
    {
        public MainForm()
        {
            InitializeComponent();
        }

        private void MainForm_Load(object sender, EventArgs e)
        {
            Task.Factory.StartNew(() =>
            {
                var connectionString =
                    "Endpoint=sb://YOUR_NS.servicebus.windows.net/;SharedSecretIssuer=owner;SharedSecretValue=YOUR_SECRET";
                var client =
                    QueueClient.CreateFromConnectionString(connectionString, "devices");

                while (true)
                {
                    BrokeredMessage message = client.Receive();

                    if (message != null)
                    {
                        try
                        {
                            var body = message.GetBody<Stream>();
                            var reader = new StreamReader(body);
                            string messageText = reader.ReadToEnd();

                            listViewDevices.Invoke(new Action(() =>
                                listViewDevices.Items.Add(messageText))
                            );
                            Debug.WriteLine("Message body: " + messageText);
                            
                            message.Complete();
                        }
                        catch (Exception)
                        {
                            message.Abandon();
                        }
                    }
                } 
            }); 
        }
    }
}
