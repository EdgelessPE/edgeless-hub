using System;
using System.IO;
using System.Threading.Tasks;

namespace DiskScanner
{
    public class Scanner
    {
        public async Task<object> getDiskInfo(Object input)
        {
            DriveInfo[] drives = DriveInfo.GetDrives();
            string[] results = new string[drives.Length];
            int pointer = 0;
            foreach (DriveInfo i in drives)
            {
                if (i.DriveType == DriveType.Fixed || i.DriveType == DriveType.Removable)
                {
                    results[pointer] = i.Name + (i.DriveType == DriveType.Removable ? 1 : 0) + i.VolumeLabel;
                    //Console.WriteLine(results[pointer]);
                    pointer++;
                }
            }
            return results;
        }
    }
}
