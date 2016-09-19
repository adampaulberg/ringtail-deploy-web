
// Overview of edge.js: http://tjanczuk.github.com/edge
//
// Use C# to invoke Java jar file that exposes FTP functionality ( supports Proxy and NTLM FTP )
//

//#r "System.Core.dll"
//#r "System.Web.Extensions.dll"
//#r "System.Xml.dll"

using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Diagnostics;

// Required for edge to invoke the C# from Nodejs
public class Startup
{
    /// <summary>
    /// Pass in corresponding JavaScript object and specify an action ( DIRECTORY or FILE )
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    public async Task<object> Invoke(dynamic input)
    {
        Debugger.Launch();
        var typeOfOperation = (string)input.action;
        if (string.IsNullOrEmpty(typeOfOperation))
        {
            typeOfOperation = "DIRECTORY";
        }
        else
        {
            if (typeOfOperation == "VALIDATE")
            {
                return this.GetValidateFiles(input);
            }
        }

        return typeOfOperation == "DIRECTORY" ? this.GetRemoteBranches(input) : this.GetRemoteFiles(input);
    }

    string GetRemoteBranches(dynamic input)
    {
        return Helper.GetRemoteBranches(input);
    }

    string GetRemoteFiles(dynamic input)
    {
        return Helper.GetValidateLocation(input);
        //return Helper.GetRemoteFiles(input);
    }

    string GetValidateFiles(dynamic input)
    {
        return Helper.GetValidateLocation(input);
    }
}

// Utility class just to keep arguments clean
public class Options
{
    public string FtpHost { get; set; }
    public string FtpUser { get; set; }
    public string FtpPassword { get; set; }
    public string FtpProxyPort { get; set; }
    public string FtpProxyUser { get; set; }
    public string FtpProxyPassword { get; set; }
    public string FtpProxyHost { get; set; }
    public string Branch { get; set; }
    public string CurrentVersion { get; set; }
    public string ScriptLocation { get; set; }

    public Options(string ftpHost, string ftpUser, string ftpPassword, string ftpProxyHost, string ftpProxyPort, string branch, string currentVersion, string scriptLocation, string ftpProxyUser = null, string ftpProxyPassword = null)
    {
        FtpHost = ftpHost;
        FtpUser = ftpUser;
        FtpPassword = ftpPassword;
        FtpProxyHost = ftpProxyHost;
        FtpProxyPort = ftpProxyPort;
        Branch = branch;
        CurrentVersion = currentVersion;
        FtpProxyUser = ftpProxyUser;
        FtpProxyPassword = ftpProxyPassword;
        ScriptLocation = scriptLocation;
    }
}

public static class FTPRunner
{
    private const string process = "java";
    private const string jarFile = "FtpOperations-v0.1.jar";


    public class RunResults
    {
        public int ExitCode;
        public Exception RunException;
        public StringBuilder Output;
        public StringBuilder Error;
    }


    public static RunResults Run(string ftpRequestMethod, Options options, string localFilePath = null)
    {

        RunResults runResults = new RunResults
        {
            Output = new StringBuilder(),
            Error = new StringBuilder(),
            RunException = null
        };

        try
        {
            using (Process proc = new Process())
            {
                var baseArgs = "-jar " + System.IO.Path.Combine(options.ScriptLocation, jarFile);
                string baseUrlArgs = string.Format("-url {0} -r \"{1}\" ", options.FtpHost, options.Branch);
                if (!string.IsNullOrEmpty(options.FtpUser) && !string.IsNullOrEmpty(options.FtpUser))
                {
                    baseUrlArgs += string.Format("-un {0} -pw {1} ", options.FtpUser, options.FtpPassword);
                }

                if (!string.IsNullOrEmpty(options.FtpProxyHost))
                {
                    baseUrlArgs += string.Format("-ph {0} ", options.FtpProxyHost);
                }

                if (!string.IsNullOrEmpty(options.FtpProxyPort))
                {
                    baseUrlArgs += string.Format("-pp {0} ", options.FtpProxyPort);
                }

                if (!string.IsNullOrEmpty(options.FtpProxyUser) && !string.IsNullOrEmpty(options.FtpProxyPassword))
                {
                    baseUrlArgs += string.Format("-pu {0} -pup {1} ", options.FtpProxyPort, options.FtpProxyPassword);
                }

                string args = null;
                proc.StartInfo.FileName = process;
                if (ftpRequestMethod == WebRequestMethods.Ftp.ListDirectory)
                {
                    args = string.Format("{0} -l {1}", baseArgs, baseUrlArgs);
                }
                else if (ftpRequestMethod == WebRequestMethods.Ftp.ListDirectoryDetails)
                {
                    args = string.Format("{0} -ld {1}", baseArgs, baseUrlArgs);
                }
                else if (ftpRequestMethod == WebRequestMethods.Ftp.DownloadFile)
                {
                    args = string.Format("{0} -sf \"{1}\" {2}", baseArgs, localFilePath, baseUrlArgs);
                }
                proc.StartInfo.Arguments = args;
                proc.StartInfo.WorkingDirectory = Directory.GetCurrentDirectory();
                proc.StartInfo.UseShellExecute = false;
                proc.StartInfo.CreateNoWindow = true;
                proc.StartInfo.RedirectStandardOutput = true;
                proc.StartInfo.RedirectStandardError = true;

                proc.OutputDataReceived += (o, e) => runResults.Output.Append(e.Data).Append(Environment.NewLine);
                proc.ErrorDataReceived += (o, e) => runResults.Error.Append(e.Data).Append(Environment.NewLine);

                proc.Start();

                proc.BeginOutputReadLine();
                proc.BeginErrorReadLine();

                proc.WaitForExit();

                runResults.ExitCode = proc.ExitCode;

            }

        }
        catch (Exception e)
        {

            runResults.RunException = e;
        }

        return runResults;
    }

}

public static class Helper
{

    public static string GetRemoteBranches(dynamic input)
    {
        return GetRemoteList(input, WebRequestMethods.Ftp.ListDirectory);
    }

    public static string GetRemoteFiles(dynamic input)
    {
        return GetRemoteList(input, WebRequestMethods.Ftp.ListDirectory);
    }

    public static string GetValidateLocation(dynamic input)
    {
        try
        {
            List<string> remoteList = ValidateRemoteLocation(input);
            var jsonSerialiser = new JavaScriptSerializer();
            var result = jsonSerialiser.Serialize(remoteList);
            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
        }

        return "{}";
    }


    private static Options GenerateOptionsFromDynamic(dynamic input)
    {

        string proxy = (string)input.ftpProxyHost;
        string proxyport = (string)input.ftpProxyPort;
        try
        {
            if (!String.IsNullOrEmpty(proxy) && proxy.Contains(":"))
            {
                string tempProxy = proxy;
                if (!proxy.StartsWith("http://"))
                {
                    tempProxy = string.Format("http://{0}", proxy);
                }
                Uri baseUri = new Uri(tempProxy);
                proxy = proxy.Replace(":" + baseUri.Port, "");

                if (String.IsNullOrEmpty(proxyport))
                {
                    proxyport = baseUri.Port.ToString();
                }
            }
        }
        catch (System.Exception) { }

        Options options = new Options((string)input.ftpHost, (string)input.ftpUser, (string)input.ftpPassword,
            proxy, proxyport, (string)input.branch, (string)input.currentVersion, (string)input.scriptLocation);
        FtpOptionsCleanup(options);
        return options;
    }

    private static string GetRemoteList(dynamic input, string ftpRequestMethod)
    {
        try
        {
            Options options = GenerateOptionsFromDynamic(input);
            return GetRemoteListingJson(ftpRequestMethod, options);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
        }

        return string.Empty;
    }

    private static List<string> ValidateRemoteLocation(dynamic input)
    {
        var result = new List<string>();
        bool okOverall = false;

        try
        {
            var ret = GetRemoteList(input, WebRequestMethods.Ftp.ListDirectoryDetails);
            var jsonSerialiser = new JavaScriptSerializer();
            result = jsonSerialiser.Deserialize<List<string>>(ret);

            try
            {
                if (result != null)
                {
                    var tmpResult = new List<string>();
                    Options options = GenerateOptionsFromDynamic(input);
                    options.Branch = options.Branch + @"/Manifest.txt";
                    okOverall = VerifyManifest(result, options, out tmpResult);
                    result = tmpResult;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
                result = new List<string>();
                result.Add("There is no manifest file in this location.");
                okOverall = false;
            }
        }
        catch (Exception ex)
        {
            result = new List<string>();
            result.Add("Bad");
            okOverall = false;
            Console.WriteLine(ex);
        }

        if (okOverall)
        {
            result = new List<string>();
            result.Add("OK");
        }


        return result;
    }

    private static bool AllowBranchVersion(string current, string manifest)
    {
        var cArray = current.Split('.');
        var mArray = manifest.Split('.');

        //mismatch, allow it
        if (cArray.Length != mArray.Length)
        {
            return true;
        }

        for (var i = 0; i < cArray.Length; i++)
        {
            var intCurrentVal = Int32.Parse(cArray[i]);
            var intManifestVal = Int32.Parse(mArray[i]);

            if (intCurrentVal == intManifestVal)
            {
                continue;
            }

            else if (intCurrentVal > intManifestVal)
            {
                return false;
            }

            return true;
        }

        //i don't know what happened, but allow it
        return true;
    }

    private static bool VerifyManifest(List<string> listing, Options options, out List<string> validationResult)
    {
        var okOverall = true;

        var manifestContents = GetManifestFileContents(options);
        validationResult = new List<string>();

        foreach (var x in manifestContents)
        {
            if (x.FileName == "Manifest.txt")
            {
                continue;
            }

            bool ringtailVersionOk = true;
            if (options.CurrentVersion != null && options.CurrentVersion != "0.0.0.0")
            {
                if (x.FileName.IndexOf("Ringtail_Main Ringtail8") >= 0)
                {
                    var allowIt = AllowBranchVersion(options.CurrentVersion, x.Version);
                    if (!allowIt)
                    {
                        validationResult.Add("This is an earlier version than what is already installed.");
                        ringtailVersionOk = false;
                    }
                }
            }

            bool fileExists = false;
            bool fileSizeMatch = false;
            foreach (var y in listing)
            {
                if (y.Contains(x.FileName))
                {
                    fileExists = true;

                    if (y.Contains(x.FileSize.ToString()))
                    {
                        fileSizeMatch = true;
                    }
                    else
                    {
                        var item = "The file size is incorrect for " + x.FileName;
                        if (item.Length > 75)
                        {
                            item = item.Substring(0, 75) + " ...";
                        }
                        validationResult.Add(item);
                    }
                }
            }

            if (!fileExists)
            {
                var item = "The location is missing " + x.FileName;
                if (item.Length > 75)
                {
                    item = item.Substring(0, 75) + " ...";
                }
                validationResult.Add(item);
            }
            okOverall = okOverall ? fileExists && fileSizeMatch && ringtailVersionOk : false;
        }

        return okOverall;
    }

    public static void FtpOptionsCleanup(Options options)
    {
        var ftpUrl = string.Empty;

        if (string.IsNullOrEmpty(options.Branch))
            ftpUrl = options.FtpHost;
        else
        {
            ftpUrl = options.FtpHost.TrimEnd('/');
            ftpUrl = options.FtpHost + "/" + options.Branch.TrimStart('/');
            ftpUrl = ftpUrl.Replace(" ", "%20");
        }
        //Clean up the URL
        ftpUrl = ValidateAndFixFtp(ftpUrl);
    }


    /// <summary>
    /// Handle the FtpWebResponse and try to parse the HTML output in the event that a proxy returns
    /// HTML versus content.
    /// </summary>
    /// <param name="ftpRequest"></param>
    /// <param name="ftpRequestMethod"></param>
    /// <param name="isProxy"></param>
    /// <returns></returns>
    private static string GetRemoteListingJson(string ftpRequestMethod, Options options)
    {
        var ret = FTPRunner.Run(ftpRequestMethod, options);
        return ret.Output.ToString();
    }

    public static List<FileItem> GetManifestFileContents(Options options)
    {
        string downloadPath = null;
        var ftpListing = new List<FileItem>();

        downloadPath = System.IO.Path.Combine(Path.GetTempPath(), Path.GetTempFileName());
        var ret = FTPRunner.Run(WebRequestMethods.Ftp.DownloadFile, options, downloadPath);

        if ((ret.ExitCode == 0) && (System.IO.File.Exists(downloadPath)))
        {
            using (StreamReader reader = new StreamReader(downloadPath))
            {
                string _line = reader.ReadLine();
                while (!string.IsNullOrEmpty(_line))
                {
                    var line = _line.Replace("\"", "");
                    var splitLine = line.Split(':');
                    FileItem fi = new FileItem();
                    fi.FileName = splitLine[0];
                    long length = 0;
                    string version = "99.99.99.9999";

                    bool success = long.TryParse(splitLine[1], out length);

                    if (splitLine.Length > 2)
                    {
                        version = splitLine[2];
                    }

                    fi.Version = version;

                    if (success)
                    {
                        fi.FileSize = length;
                        ftpListing.Add(fi);
                    }
                    _line = reader.ReadLine();
                }
            }
        }

        return ftpListing;
    }

    private static bool IsValidFtpPath(string ftpPath)
    {
        bool result = false;

        try
        {
            Uri uri;
            if (Uri.TryCreate(ftpPath, UriKind.RelativeOrAbsolute, out uri))
            {
                result = (uri.Scheme == Uri.UriSchemeFtp) && (uri.IsWellFormedOriginalString());
            }
        }
        catch (Exception ex) { }

        return result;
    }

    private static string ValidateAndFixFtp(string ftpPath)
    {
        if (IsValidFtpPath(ftpPath))
            return ftpPath;

        var originalPath = ftpPath;
        if (!ftpPath.StartsWith(Uri.UriSchemeFtp + Uri.SchemeDelimiter))
        {
            ftpPath = Uri.UriSchemeFtp + Uri.SchemeDelimiter + ftpPath;
            if (IsValidFtpPath(ftpPath))
                return ftpPath;

            ftpPath = originalPath;
        }

        if (ftpPath.StartsWith(Uri.SchemeDelimiter))
        {
            ftpPath = Uri.UriSchemeFtp + ftpPath;
            if (IsValidFtpPath(ftpPath))
                return ftpPath;

            ftpPath = originalPath;
        }

        if (Uri.CheckHostName(ftpPath) == UriHostNameType.Unknown)
        {
            // error
        }

        return ftpPath;
    }

    private static string GetFtpPort(ref string ftpPath)
    {
        Uri uri;
        if (Uri.TryCreate(ftpPath, UriKind.RelativeOrAbsolute, out uri))
        {
            string port = uri.Port.ToString();
            ftpPath = ftpPath.Replace(":" + port, "");
            return uri.Port.ToString();
        }

        return "21";
    }
}

public class FileItem
{

    public static FileItem TryParse(string value)
    {
        //"Apr 13 2016 15:32    254059808 <A HREF=\"RingtailLegalApplicationServer_Frozen.exe\">RingtailLegalApplicationServer_Frozen.exe</A>"
        var fileItem = new FileItem();

        var leftSide = value.Split('<')[0];
        var fileSize = leftSide.Substring(18, leftSide.Length - 18);

        long realSize = 0;
        long.TryParse(fileSize, out realSize);

        fileItem.FileSize = realSize;


        var rightSide = value.Split('<')[1];
        var fileName = rightSide.Split('>')[1];

        fileItem.FileName = fileName;

        return fileItem;
    }

    public string FileName { get; set; }
    public string Version { get; set; }
    public long FileSize { get; set; }


    public override string ToString()
    {
        return String.Format("{0} | {1} | {2}", FileName, FileSize, Version);
    }
}