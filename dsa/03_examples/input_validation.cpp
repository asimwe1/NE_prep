#include <iostream>
#include <string>
#include <cctype> 

using namespace std;

// Manual validation check - no external libraries needed
bool isValid(const std::string& s) { 
    for(char c : s){ if(!std::isalnum(static_cast<unsigned char>(c))) return false; } 
    return true && !s.empty(); // Ensure not empty
}

int main(){ 
   std::string input;
   while(true){ // Keep asking until valid
      cin >> input; // Reads word by default (stops at whitespace)
      
      if(isValid(input)) break; // Stop when alphanumeric only is found
      
      cout << "Invalid! Please enter number or letters without spaces/chars:\n"; 
   }

}
