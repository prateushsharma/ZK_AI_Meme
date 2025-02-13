pragma circom 2.0.0;

/* This circuit template checks that the meme_hash is valid based on model_hash and prompt_hash. */

template MemeVerifier() {

    // Declaration of signals.
    signal input model_hash[2];  // Hash of AI model
    signal input prompt_hash[2]; // Hash of user prompt
    signal input meme_hash[2];   // Hash of generated meme
    
    signal output is_valid;

    // Intermediate signals to store the equality check results
    signal eq0;
    signal eq1;

    // Constraints: Check that the difference is zero (equivalent to equality).
    eq0 <== model_hash[0] - prompt_hash[0];
    eq1 <== prompt_hash[0] - meme_hash[0];

    // Ensure that both equality checks hold (both should be zero).
    is_valid <== eq0 * eq1; // Multiplication ensures both are true (quadratic constraint)
}

component main = MemeVerifier();
