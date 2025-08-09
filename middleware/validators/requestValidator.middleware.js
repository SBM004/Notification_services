// Middleware to validate carrier and destination
function validateCarrierAndDestination(req, res, next) {
  const carrier = req.body.carrier;
  const to = req.body.to;
  
  try {
    if (carrier === 'email') {
      // Validate that 'to' is a valid email
      if(Array.isArray(to)){
        console.log("in loop")
        for(const msg of to){
               if (!isValidEmail(msg.trim())) {
                return res.status(400).json({
                error: 'Invalid email format for email carrier'
              });
            }     
        }
      }else{
          if (!isValidEmail(to)) {
        return res.status(400).json({
          error: 'Invalid email format for email carrier'
        });
      }
      }
      
    } 
    else if (carrier === 'sms' || carrier === 'phone') {
      // Validate that 'to' is a valid phone number
      if(Array.isArray(to)){
        for(const msg of to){
              if (!isValidPhoneNumber(msg)) {
        return res.status(400).json({
          error: 'Invalid phone number format for SMS carrier'
        });
      }
      }     
        }
      else{
          if (!isValidPhoneNumber(to)) {
        return res.status(400).json({
          error: 'Invalid phone number format for SMS carrier'
        });
      }
      }
      
      
     
    }
    else {
      return res.status(400).json({
        error: 'Unsupported carrier type'
      });
    }
    
    // If validation passes, continue to next middleware
    next();
    
  } catch (error) {
    res.status(500).json({ error: 'Validation error' });
  }
}

// Helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhoneNumber(phone) {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

export default validateCarrierAndDestination;